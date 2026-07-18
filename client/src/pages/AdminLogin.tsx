import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Lock, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const initAdminSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email address'),
  bootstrapSecret: z.string().min(1, 'Bootstrap secret is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type InitAdminFormData = z.infer<typeof initAdminSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const initForm = useForm<InitAdminFormData>({
    resolver: zodResolver(initAdminSchema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      bootstrapSecret: '',
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      setIsLoggingIn(true);
      const res = await apiRequest('POST', '/api/admin/login', data);
      const result = await res.json();

      if (result.success) {
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${result.admin.username}!`,
        });
        
        // Invalidate session query to force refresh of admin state
        await queryClient.invalidateQueries({ queryKey: ['/api/admin/session'] });
        
        // Navigate to admin dashboard
        setLocation('/admin/dashboard');
      } else {
        toast({
          title: 'Login Failed',
          description: result.message || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Login Error',
        description: error instanceof Error ? error.message : 'Failed to login',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleInitAdmin = async (data: InitAdminFormData) => {
    try {
      setIsInitializing(true);
      const res = await apiRequest('POST', '/api/admin/init', data);
      const result = await res.json();

      if (result.success) {
        toast({
          title: 'Admin Created',
          description: 'First admin account created successfully. Please login.',
        });
        initForm.reset();
      } else {
        toast({
          title: 'Initialization Failed',
          description: result.message || 'Failed to create admin account',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Initialization Error',
        description: error instanceof Error ? error.message : 'Failed to initialize admin',
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary via-accent to-primary rounded-lg flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            JERUSALEM Admin Panel
          </h1>
          <p className="text-muted-foreground">DeFi Security Scanner Administration</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Admin Login
            </CardTitle>
            <CardDescription>
              Sign in to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your username"
                          data-testid="input-login-username"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter your password"
                          data-testid="input-login-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoggingIn}
                  data-testid="button-login"
                >
                  {isLoggingIn ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-accent" />
              Initialize First Admin
            </CardTitle>
            <CardDescription>
              Create the first admin account (only works if no admins exist)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...initForm}>
              <form onSubmit={initForm.handleSubmit(handleInitAdmin)} className="space-y-4">
                <FormField
                  control={initForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Choose a username"
                          data-testid="input-init-username"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={initForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="admin@example.com"
                          data-testid="input-init-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={initForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Choose a strong password"
                          data-testid="input-init-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={initForm.control}
                  name="bootstrapSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bootstrap Secret</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter the ADMIN_BOOTSTRAP_SECRET value"
                          data-testid="input-init-bootstrap-secret"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">
                        This is the ADMIN_BOOTSTRAP_SECRET environment variable set on the server
                      </p>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={isInitializing}
                  data-testid="button-init-admin"
                >
                  {isInitializing ? 'Creating Admin...' : 'Create Admin Account'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
