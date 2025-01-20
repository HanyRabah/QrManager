'use client';

import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

interface User {
  id?: string;
  name: string;
  title: string;
  district: string;
  region: string; 
  scanned?: boolean;
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const filterUsers = React.useCallback(() => {
    const query = searchQuery.toLowerCase();
    const filtered = users.filter((user) =>
      Object.values(user)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Filter users when search query changes
  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/export');
      const data = await response.json();
      setUsers(data);
      setError('');
    } catch {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: User[] = XLSX.utils.sheet_to_json(sheet);

        const response = await fetch('/api/users/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jsonData),
        });

        if (!response.ok) throw new Error('Failed to upload data');

        const result = await response.json();
        setUsers(result);
        setError('');
      } catch {
        setError('Failed to upload data');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleExport = async () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(users);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      XLSX.writeFile(workbook, 'users_export.xlsx');
    } catch {
      setError('Failed to export data');
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedUser?.id) return;

    try {

      const updatedUser = { ...selectedUser };


      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });
  
      if (!response.ok) throw new Error('Failed to update user');
  
      await fetchUsers(); // Refresh the user list
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch {
      setError('Failed to update user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete user');

      await fetchUsers();
    } catch{
      setError('Failed to delete user');
    }
  };

 
  if (loading) return <LinearProgress />;

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          QR Code Manager
        </Typography>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadIcon />}
              >
                Upload Excel
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </Button> 

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                disabled={users.length === 0}
              >
                Export Excel
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Search and Table Section */}
      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>الاسم</TableCell>
                  <TableCell>الجهة</TableCell>
                  <TableCell>البلد</TableCell>
                  <TableCell>المنطقة</TableCell>
                  <TableCell>تم المسح</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.title}</TableCell>
                    <TableCell>{user.district}</TableCell>
                    <TableCell>{user.region}</TableCell>
                    <TableCell>
                      {user.scanned ? 'Scanned' : 'Not Scanned'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(user)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => user.id && handleDelete(user.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={selectedUser?.name || ''}
              onChange={(e) =>
                setSelectedUser(
                  (prev) => prev && { ...prev, name: e.target.value }
                )
              }
              fullWidth
            />
            <TextField
              label="Title"
              value={selectedUser?.title || ''}
              onChange={(e) =>
                setSelectedUser(
                  (prev) => prev && { ...prev, title: e.target.value }
                )
              }
              fullWidth
            />
            <TextField
              label="District"
              value={selectedUser?.district || ''}
              onChange={(e) =>
                setSelectedUser(
                  (prev) => prev && { ...prev, district: e.target.value }
                )
              }
              fullWidth
            />
            <TextField
              label="Region"
              value={selectedUser?.region || ''}
              onChange={(e) =>
                setSelectedUser(
                  (prev) => prev && { ...prev, region: e.target.value }
                )
              }
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}