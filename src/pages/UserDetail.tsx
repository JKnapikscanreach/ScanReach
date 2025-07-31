import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, Trash2, Shield, ShieldOff, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUsers, type User } from '@/hooks/useUsers';
import { useOrderHistory } from '@/hooks/useOrderHistory';
import { OrderHistoryModal } from '@/components/OrderHistoryModal';
import { useToast } from '@/hooks/use-toast';

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { users, updateUser, deleteUser } = useUsers();
  const { orders, loading: ordersLoading } = useOrderHistory(''); // We'll filter by user
  
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
  });
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
      setEditForm({
        first_name: foundUser.first_name,
        last_name: foundUser.last_name,
        email: foundUser.email,
        company_name: foundUser.company_name || '',
      });
    }
  }, [users, userId]);

  const handleSave = async () => {
    if (!user) return;
    
    const result = await updateUser(user.id, editForm);
    if (result.success) {
      setIsEditing(false);
      toast({
        title: "User updated",
        description: "User profile has been successfully updated.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    const result = await deleteUser(user.id);
    if (result.success) {
      toast({
        title: "User deleted",
        description: "User has been successfully deleted.",
      });
      navigate('/users');
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleToggleAdmin = async () => {
    if (!user) return;
    
    const result = await updateUser(user.id, { is_admin: !user.is_admin });
    if (result.success) {
      toast({
        title: user.is_admin ? "Admin access revoked" : "Admin access granted",
        description: `User ${user.is_admin ? 'no longer has' : 'now has'} admin privileges.`,
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>User not found.</p>
          <Button asChild className="mt-4">
            <Link to="/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Filter orders for this user (matching by email since that's what we have)
  const userOrders = orders.filter(order => order.customers?.email === user.email);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" asChild>
          <Link to="/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {user.first_name} {user.last_name}
            {user.is_admin && (
              <Badge variant="outline" className="ml-2">Admin</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                User account details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={editForm.first_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={editForm.last_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={editForm.company_name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <p className="text-sm">{user.first_name}</p>
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <p className="text-sm">{user.last_name}</p>
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  <div>
                    <Label>Company Name</Label>
                    <p className="text-sm">{user.company_name || 'Not specified'}</p>
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sign Up Date</Label>
                  <p className="text-sm">{formatDate(user.created_at)}</p>
                </div>
                <div>
                  <Label>Last Login</Label>
                  <p className="text-sm">
                    {user.last_login ? formatDate(user.last_login) : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics & Actions */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Microsites</Label>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.microsite_count || 0}</span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/microsites?user=${user.id}`}>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <Label>Sticker Orders</Label>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.sticker_order_count || 0}</span>
                  {userOrders.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowOrderModal(true)}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <Label>Subscription</Label>
                <Badge variant={user.subscription_status === 'enterprise' ? 'destructive' : 'default'}>
                  {user.subscription_status.charAt(0).toUpperCase() + user.subscription_status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>
                Manage user permissions and account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={handleToggleAdmin}
                className="w-full justify-start"
              >
                {user.is_admin ? (
                  <>
                    <ShieldOff className="h-4 w-4 mr-2" />
                    Revoke Admin Access
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Grant Admin Access
                  </>
                )}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the user account
                      and remove all associated data including microsites and order history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete User
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
      />
    </div>
  );
}