'use client';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
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
  createTheme,
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
  ThemeProvider,
  Tooltip,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import * as XLSX from 'xlsx';

// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Create RTL theme
const theme = createTheme({
  direction: 'rtl',
});

const StatusChip = styled('span')<{ scanned: boolean }>(({ theme, scanned }) => ({
  padding: theme.spacing(0.5, 1.5),
  borderRadius: '16px',
  fontSize: '0.875rem',
  backgroundColor: scanned ? '#e6f4ea' : '#fdeded',
  color: scanned ? '#1e7e34' : '#d32f2f',
  display: 'inline-block',
  textAlign: 'center',
}));

interface User {
  id?: string;
  name: string;
  title: string;
  district: string;
  region: string;
  scanned?: boolean;
  scannedTimes?: number;
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const filterUsers = React.useCallback(() => {
    const query = searchQuery.toLowerCase();
    const filtered = users.filter((user) =>
      Object.values(user).join(' ').toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

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
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedUser),
      });

      if (!response.ok) throw new Error('Failed to update user');

      await fetchUsers();
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch {
      setError('Failed to update user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد أنك تريد حذف هذا المستخدم؟')) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete user');

      await fetchUsers();
    } catch {
      setError('Failed to delete user');
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <Box dir="rtl">
          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              QR Manager - by deepAdv
            </Typography>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadIcon />}
                  >
                    رفع ملف Excel
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
                    تحميل ملف Excel
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
                placeholder="البحث عن المستخدمين..."
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
                      <TableCell align="right">الاسم</TableCell>
                      <TableCell align="right">الجهة</TableCell>
                      <TableCell align="right">البلد</TableCell>
                      <TableCell align="right">المنطقة</TableCell>
                      <TableCell align="right">حالة المسح</TableCell> 
                      <TableCell align="right">عدد مرات المسح</TableCell>
                      <TableCell align="right">الإجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell align="right">{user.name}</TableCell>
                        <TableCell align="right">{user.title}</TableCell>
                        <TableCell align="right">{user.district}</TableCell>
                        <TableCell align="right">{user.region}</TableCell>
                        <TableCell align="right">
                          <StatusChip scanned={!!user.scanned}>
                            {user.scanned ? 'تم المسح' : 'لم يتم المسح'}
                          </StatusChip>
                        </TableCell>
                        <TableCell align="right">{user.scannedTimes}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Tooltip title="تعديل">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(user)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="حذف">
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
            <DialogTitle>تعديل المستخدم</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="الاسم"
                  value={selectedUser?.name || ''}
                  onChange={(e) =>
                    setSelectedUser(
                      (prev) => prev && { ...prev, name: e.target.value }
                    )
                  }
                  fullWidth
                />
                <TextField
                  label="الجهة"
                  value={selectedUser?.title || ''}
                  onChange={(e) =>
                    setSelectedUser(
                      (prev) => prev && { ...prev, title: e.target.value }
                    )
                  }
                  fullWidth
                />
                <TextField
                  label="البلد"
                  value={selectedUser?.district || ''}
                  onChange={(e) =>
                    setSelectedUser(
                      (prev) => prev && { ...prev, district: e.target.value }
                    )
                  }
                  fullWidth
                />
                <TextField
                  label="المنطقة"
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
              <Button onClick={() => setEditDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleSave} variant="contained">
                حفظ
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
}
