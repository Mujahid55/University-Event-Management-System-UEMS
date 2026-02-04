import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GraduationCap, LogOut, User, Settings, Shield, Plus, LayoutDashboard, BarChart3, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/NotificationBell";

export function Navbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      member: "Member",
      officer: "Officer",
      sponsor: "Sponsor",
      sa: "SA Reviewer",
      admin: "Admin",
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === "admin") return "bg-destructive text-destructive-foreground";
    if (role === "sa") return "bg-accent text-accent-foreground";
    if (role === "officer" || role === "sponsor") return "bg-primary text-primary-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <nav className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">CEMS</h1>
            <p className="text-xs text-muted-foreground">Clubs Event Management</p>
          </div>
        </div>

        {profile && (
          <div className="flex items-center gap-1 md:gap-2">
            {/* Desktop navigation - hidden on mobile */}
            <div className="hidden lg:flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/calendar")}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/analytics")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              
              {(profile.role === "officer" || profile.role === "sponsor") && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/templates")}
                >
                  Templates
                </Button>
              )}
              
              {profile.role === "admin" && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/admin")}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/admin/venues")}
                  >
                    Venues
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/admin/clubs")}
                  >
                    Clubs
                  </Button>
                </>
              )}
              
              {(profile.role === "officer" || profile.role === "sponsor") && (
                <Button 
                  size="sm"
                  onClick={() => navigate("/events/new")}
                  className="bg-gradient-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              )}
            </div>

            {/* Mobile create button - only show icon */}
            {(profile.role === "officer" || profile.role === "sponsor") && (
              <Button 
                size="sm"
                onClick={() => navigate("/events/new")}
                className="lg:hidden"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            
            <NotificationBell />
            
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                  <Badge className={`mt-1 ${getRoleBadgeVariant(profile.role)}`}>
                    {getRoleDisplay(profile.role)}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Mobile navigation in dropdown */}
              <div className="lg:hidden">
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/calendar")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/analytics")}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </DropdownMenuItem>
                
                {(profile.role === "officer" || profile.role === "sponsor") && (
                  <DropdownMenuItem onClick={() => navigate("/templates")}>
                    Templates
                  </DropdownMenuItem>
                )}
                
                {profile.role === "admin" && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/admin/venues")}>
                      Venues
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/admin/clubs")}>
                      Clubs
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
              </div>
              
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        )}
      </div>
    </nav>
  );
}
