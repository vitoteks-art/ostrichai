import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { adminService } from '../services/adminService';
import { ProtectedAdminRoute } from '../components/ProtectedAdminRoute';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useToast } from '../hooks/use-toast';
import type { AdminUser, UserRole } from '../types/admin';
import Layout from '../components/Layout';
import { Skeleton } from '../components/ui/skeleton';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Crown,
  UserCheck,
  Eye,
  Home,
  ChevronRight,
  RefreshCw,
  UserX,
  Mail,
  Calendar,
  Activity,
  Loader2,
  ChevronLeft,
} from 'lucide-react';

const AdminUserManagement: React.FC = () => {
  const { isSuperAdmin, checkPermission } = useAdmin();
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: 'user' as UserRole,
  });
  const [editProfileData, setEditProfileData] = useState({
    full_name: '',
    phone: '',
    location: '',
    bio: '',
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage, pageSize, roleFilter]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialLoad) {
        setCurrentPage(0);
        loadUsers();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadUsers = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await adminService.getPaginatedUsers(user.id, {
        search: searchTerm,
        roleFilter: roleFilter,
        limit: pageSize,
        offset: currentPage * pageSize
      });

      setUsers(result.users);
      setTotalCount(result.totalCount);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Note: In a real implementation, you'd create the user through Supabase Auth Admin API
      // For now, we'll simulate the creation
      toast({
        title: 'Feature Coming Soon',
        description: 'User creation will be implemented with Supabase Auth Admin API',
      });
      setIsCreateDialogOpen(false);
      setNewUser({ email: '', full_name: '', role: 'user' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await adminService.assignRole(userId, newRole, user.id);
      if (result.success) {
        toast({
          title: 'Success',
          description: `User role updated to ${newRole}`,
        });
        loadUsers(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update user role',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await adminService.deleteUser(user.id, userId);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });
        loadUsers(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleEditProfile = (user: AdminUser) => {
    setSelectedUser(user);
    setEditProfileData({
      full_name: user.full_name || '',
      phone: '', // You can add phone field to AdminUser type if needed
      location: '', // You can add location field to AdminUser type if needed
      bio: '', // You can add bio field to AdminUser type if needed
    });
    setIsEditProfileDialogOpen(true);
  };

  const handleUpdateProfile = async () => {
    if (!selectedUser || !user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await adminService.updateUserProfile(user.id, selectedUser.id, editProfileData);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'User profile updated successfully',
        });
        loadUsers(); // Refresh the list
        setIsEditProfileDialogOpen(false);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update user profile',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user profile',
        variant: 'destructive',
      });
    }
  };

  const handleToggleUserStatus = async (userId: string, currentlyActive: boolean) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await adminService.toggleUserStatus(user.id, userId, currentlyActive);
      if (result.success) {
        toast({
          title: 'Success',
          description: `User ${currentlyActive ? 'deactivated' : 'reactivated'} successfully`,
        });
        loadUsers(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: result.error || `Failed to ${currentlyActive ? 'deactivate' : 'reactivate'} user`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${currentlyActive ? 'deactivate' : 'reactivate'} user`,
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'admin':
        return 'bg-blue-500 text-white';
      case 'moderator':
        return 'bg-green-500 text-white';
      case 'viewer':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'moderator':
        return <UserCheck className="h-3 w-3" />;
      case 'viewer':
        return <Eye className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ProtectedAdminRoute requiredPermission="users" requiredAction="manage">
      <Layout>
        <div className="space-y-8 animate-in fade-in duration-700">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage user accounts, roles, and system permissions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadUsers}
                className="bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-md"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the system and assign their initial role.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUser}>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: totalCount, icon: Users, color: 'text-blue-500' },
              { label: 'Administrators', value: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length, icon: Shield, color: 'text-purple-500' },
              { label: 'Active Status', value: users.filter(u => u.is_active).length, icon: Activity, color: 'text-emerald-500' },
              { label: 'Growth', value: '+12%', icon: ChevronRight, color: 'text-orange-500' },
            ].map((stat, i) => (
              <Card key={i} className="bg-card/50 backdrop-blur-xl border-white/5 overflow-hidden group hover:border-primary/50 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Card>
            ))}
          </div>

          {/* Filters Section */}
          <Card className="bg-card/30 backdrop-blur-xl border-white/5">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 focus:ring-primary/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[160px] bg-white/5 border-white/10">
                      <Filter className="h-4 w-4 mr-2 opacity-70" />
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
                    <SelectTrigger className="w-[100px] bg-white/5 border-white/10">
                      <SelectValue placeholder="25" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 / Page</SelectItem>
                      <SelectItem value="25">25 / Page</SelectItem>
                      <SelectItem value="50">50 / Page</SelectItem>
                      <SelectItem value="100">100 / Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="bg-card/50 backdrop-blur-xl border-white/5 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/10">
                      <TableHead className="w-[300px]">User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && isInitialLoad ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="border-white/5">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-[120px]" />
                                <Skeleton className="h-3 w-[180px]" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Users className="h-12 w-12 mb-4 opacity-20" />
                            <p>No users found matching your filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 ring-2 ring-white/5 shadow-xl transition-transform group-hover:scale-110">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-semibold text-white/90">{user.full_name || 'Anonymous'}</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getRoleBadgeColor(user.role)} border-none shadow-sm`}>
                              {getRoleIcon(user.role)}
                              <span className="ml-1.5 capitalize">{user.role.replace('_', ' ')}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? 'default' : 'secondary'} className={user.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}>
                              <div className={`h-1.5 w-1.5 rounded-full mr-2 ${user.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                              {user.is_active ? 'Active' : 'Disabled'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'No login yet'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-full">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52 bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl">
                                <DropdownMenuLabel>User Options</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem onClick={() => handleEditProfile(user)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Update Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUser(user);
                                  setIsEditDialogOpen(true);
                                }}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Modify Permissions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem
                                  onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                  className={user.is_active ? "text-orange-500 hover:bg-orange-500/10" : "text-emerald-500 hover:bg-emerald-500/10"}
                                >
                                  {user.is_active ? (
                                    <><UserX className="h-4 w-4 mr-2" /> Deactivate Account</>
                                  ) : (
                                    <><UserCheck className="h-4 w-4 mr-2" /> Enable Account</>
                                  )}
                                </DropdownMenuItem>
                                {isSuperAdmin && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        className="text-destructive hover:bg-destructive/10"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Permanently Delete
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete the user account and all associated data. This action cannot be reversed.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-white/5 border-white/10">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-destructive hover:bg-destructive/90"
                                          onClick={() => handleDeleteUser(user.id)}
                                        >
                                          Delete User
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-white/5 bg-white/2">
                <p className="text-sm text-muted-foreground font-medium">
                  Showing <span className="text-white">{Math.min(currentPage * pageSize + 1, totalCount)}</span> to <span className="text-white">{Math.min((currentPage + 1) * pageSize, totalCount)}</span> of <span className="text-white">{totalCount}</span> users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0 || loading}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="bg-white/5 border-white/10 hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <div className="bg-white/10 rounded-md px-3 py-1 text-sm font-bold text-primary ring-1 ring-primary/30">
                    {currentPage + 1}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(currentPage + 1) * pageSize >= totalCount || loading}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="bg-white/5 border-white/10 hover:bg-white/10"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modals restored but updated with glassmorphism styling */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Change the role and permissions for this user.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="grid gap-4 py-4">
                <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/5 shadow-inner">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedUser.full_name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-white/90">{selectedUser.full_name || 'Anonymous'}</div>
                    <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-role">New System Role</Label>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(value: UserRole) => {
                      if (selectedUser) {
                        setSelectedUser({ ...selectedUser, role: value });
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10">
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="hover:bg-white/5">
                Cancel
              </Button>
              <Button
                className="bg-primary shadow-lg shadow-primary/20"
                onClick={() => {
                  if (selectedUser) {
                    handleRoleChange(selectedUser.id, selectedUser.role);
                    setIsEditDialogOpen(false);
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditProfileDialogOpen} onOpenChange={setIsEditProfileDialogOpen}>
          <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-white/10">
            <DialogHeader>
              <DialogTitle>Update User Profile</DialogTitle>
              <DialogDescription>
                Manage the personal details and preferences for this account.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="grid gap-4 py-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 mb-2">
                  <Avatar className="h-14 w-14 ring-4 ring-primary/10">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xl">
                      {selectedUser.full_name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary">System ID</span>
                    <span className="text-xs font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded truncate max-w-[200px]">
                      {selectedUser.id}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-full-name">Full Name</Label>
                    <Input
                      id="edit-full-name"
                      value={editProfileData.full_name}
                      onChange={(e) => setEditProfileData({ ...editProfileData, full_name: e.target.value })}
                      className="bg-white/5 border-white/10 h-10"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-phone">Phone Number</Label>
                    <Input
                      id="edit-phone"
                      value={editProfileData.phone}
                      onChange={(e) => setEditProfileData({ ...editProfileData, phone: e.target.value })}
                      className="bg-white/5 border-white/10 h-10"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-location">Location</Label>
                    <Input
                      id="edit-location"
                      value={editProfileData.location}
                      onChange={(e) => setEditProfileData({ ...editProfileData, location: e.target.value })}
                      className="bg-white/5 border-white/10 h-10"
                      placeholder="City, Country"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-bio">Account Bio</Label>
                    <textarea
                      id="edit-bio"
                      value={editProfileData.bio}
                      onChange={(e) => setEditProfileData({ ...editProfileData, bio: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none min-h-[100px] resize-none"
                      placeholder="User background information..."
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsEditProfileDialogOpen(false)} className="bg-white/5 border-white/10">
                Cancel
              </Button>
              <Button onClick={handleUpdateProfile} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                Save Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedAdminRoute>
  );
};

export default AdminUserManagement;
