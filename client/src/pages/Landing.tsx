import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Landing() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true);

  const handleGoogleAuth = () => {
    window.location.href = "/api/login";
  };

  const handleGuestLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-graduation-cap text-white text-2xl"></i>
            </div>
            <DialogTitle className="text-3xl font-bold text-gray-900">Study Tracker</DialogTitle>
            <p className="text-gray-600 mt-2">Track your academic progress effortlessly</p>
          </DialogHeader>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg p-1">
              <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="mt-2"
                  />
                </div>
                <Button className="w-full" onClick={handleGoogleAuth}>
                  Sign In
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    className="mt-2"
                  />
                </div>
                <Button className="w-full" onClick={handleGoogleAuth}>
                  Sign Up
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleAuth}
            >
              <i className="fab fa-google text-red-500 mr-3"></i>
              Continue with Google
            </Button>
            
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleGuestLogin}
            >
              <i className="fas fa-user-secret mr-2"></i>
              Continue as Guest
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
