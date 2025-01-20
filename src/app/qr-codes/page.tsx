'use client';

import {
  CreditCard as CreditCardIcon,
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Typography,
} from '@mui/material';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  title: string;
  district: string;
  region: string;
}

export default function QRCodesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users/export');
        const data = await response.json();
        setUsers(data);
        setError('');
      } catch  {
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const downloadQRCode = async (userId: string) => {
    try {
      const qrElement = document.getElementById(`qr-${userId}`);
      if (!qrElement) return;

      const dataUrl = await toPng(qrElement, { quality: 1.0 });
      const link = document.createElement('a');
      link.download = `qr-${userId}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setError('Failed to download QR code');
    }
  };

  const downloadAllQRCodes = () => {
    users.forEach((user) => {
      downloadQRCode(user.id);
    });
  };

  const downloadBusinessCard = async (userId: string) => {
    try {
      const cardElement = document.getElementById(`business-card-${userId}`);
      if (!cardElement) return;

      const dataUrl = await toPng(cardElement, {
        quality: 1.0,
        width: 1050, // 3.5 inches * 300 DPI
        height: 600,  // 2 inches * 300 DPI
      });

      const link = document.createElement('a');
      link.download = `business-card-${userId}.png`;
      link.href = dataUrl;
      link.click();
    } catch  {
      setError('Failed to download business card');
    }
  };

  const handlePreviewCard = (user: User) => {
    setSelectedUser(user);
    setPreviewOpen(true);
  };

  const BusinessCard = ({ user, id }: { user: User; id?: string }) => (
    <Box
      id={id}
      sx={{
        width: '350px',
        height: '200px',
        p: 2,
        bgcolor: 'white',
        borderRadius: 1,
        boxShadow: 3,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: '#f8f9fa',
          opacity: 0.1,
          zIndex: 0,
        }}
      />

      {/* Content */}
      <Box sx={{ flex: 1, zIndex: 1 }}>
        <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
          {user.name}
        </Typography>
        <Typography variant="body1" sx={{ mb: 0.5 }}>
          {user.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.district}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.region}
        </Typography>
      </Box>

      {/* QR Code */}
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
        <QRCodeSVG
          value={user.id}
          size={75}
          level="H"
        />
      </Box>
    </Box>
  );

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">QR Codes</Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={downloadAllQRCodes}
        >
          Download All QR Codes
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {users.map((user) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
            <Card>
              <CardContent>
                <Box 
                  id={`qr-${user.id}`}
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mb: 2,
                    p: 2,
                    bgcolor: 'white' 
                  }}
                >
                  <QRCodeSVG
                    value={user.id}
                    size={150}
                    level="H"
                    includeMargin
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  {user.name}
                </Typography>
                <Typography color="textSecondary">
                  {user.title}
                </Typography>
                <Typography variant="body2">
                  {user.district}, {user.region}
                </Typography>
              </CardContent>
              <CardActions sx={{ flexDirection: 'column', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadQRCode(user.id)}
                  fullWidth
                >
                  Download QR Code
                </Button>
                <Button
                  size="small"
                  startIcon={<CreditCardIcon />}
                  onClick={() => handlePreviewCard(user)}
                  fullWidth
                >
                  Preview Business Card
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Business Card Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
      >
        <DialogTitle>Business Card Preview</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ p: 2 }}>
              <BusinessCard 
                user={selectedUser} 
                id={`business-card-${selectedUser.id}`}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>
            Close
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => selectedUser && downloadBusinessCard(selectedUser.id)}
            variant="contained"
          >
            Download Card
          </Button>
          <Button
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            variant="contained"
          >
            Print Card
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}