  
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import AnimateOnMount from '@/components/AnimateOnMount';
import { slideUp } from '@/lib/animation';
import { HardDrive, FileSymlink, Server, Database, LogIn, UserPlus, Mail, Lock } from 'lucide-react';

// Form schemas
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const registerSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  // Handle login
  const onLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signIn(values.email, values.password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle register
  const onRegister = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await signUp(values.email, values.password);
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Only return navigate AFTER all hooks have been called
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Left side - Feature showcase */}
      <div className="md:w-1/2 p-6 md:p-12 flex flex-col justify-center text-white">
        <AnimateOnMount animation={slideUp} className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Distributed File System
            </h1>
            <p className="text-xl text-gray-300">
              Store your files across multiple nodes with advanced redundancy
            </p>
          </div>
          
          <div className="space-y-6">
            <FeatureCard 
              icon={<HardDrive className="h-8 w-8 text-blue-400" />} 
              title="Distributed Storage"
              description="Split your files across multiple storage nodes for improved reliability and performance."
            />
            
            <FeatureCard 
              icon={<FileSymlink className="h-8 w-8 text-purple-400" />} 
              title="Redundant Replication"
              description="Keep multiple copies of your files to prevent data loss and improve availability."
            />
            
            <FeatureCard 
              icon={<Server className="h-8 w-8 text-green-400" />} 
              title="Node Management"
              description="Add and monitor storage nodes with real-time status updates and capacity information."
            />
            
            <FeatureCard 
              icon={<Database className="h-8 w-8 text-yellow-400" />} 
              title="Smart File Distribution"
              description="Intelligently allocate files based on node capacity, health, and geographic location."
            />
          </div>
        </AnimateOnMount>
      </div>
      
      {/* Right side - Auth form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <AnimateOnMount animation={slideUp} className="w-full max-w-md">
          <Card className="border-0 shadow-xl bg-white/10 backdrop-blur-md text-white">
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-2xl font-bold">
                Welcome
              </CardTitle>
              <CardDescription className="text-gray-300">
                Sign in or create an account to access your files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800/50">
                  <TabsTrigger value="login" className="data-[state=active]:bg-blue-600">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-purple-600">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  placeholder="name@example.com" 
                                  className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" 
                                  {...field} 
                                />
                              </div>
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
                            <FormLabel className="text-gray-300">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  type="password" 
                                  placeholder="••••••••" 
                                  className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" 
                        disabled={isLoading}
                      >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  placeholder="name@example.com" 
                                  className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  type="password" 
                                  placeholder="••••••••" 
                                  className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  type="password" 
                                  placeholder="••••••••" 
                                  className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700" 
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </AnimateOnMount>
      </div>
    </div>
  );
};

// Feature card component for the left side
const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) => (
  <div className="flex items-start space-x-4 p-4 rounded-lg bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10">
    <div className="mt-1 flex-shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="font-medium text-lg text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  </div>
);

export default Auth;
