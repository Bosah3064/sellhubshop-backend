import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Eye, Ban, Unlock, MoreHorizontal, UserCheck, ShieldAlert } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  products_count?: number;
}

interface UserManagementProps {
  users: User[];
  selectedUsers: string[];
  setSelectedUsers: (ids: string[]) => void;
  onViewUser: (user: User) => void;
  onBanUser: (id: string) => void;
  onSuspendUser: (id: string) => void;
  onUnbanUser: (id: string) => void;
  permissions: any;
  loadingStates: { [key: string]: boolean };
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  selectedUsers,
  setSelectedUsers,
  onViewUser,
  onBanUser,
  onSuspendUser,
  onUnbanUser,
  permissions,
  loadingStates
}) => {
  return (
    <Card className="admin-glass border-none animate-fade-in shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div>
          <CardTitle className="text-slate-900 text-xl font-bold">User Matrix</CardTitle>
          <CardDescription className="text-slate-500">
            {permissions.canBanUsers
              ? "Oversee platform members and enforce policies"
              : "View active platform members"}
          </CardDescription>
        </div>
        {permissions.canBanUsers && selectedUsers.length > 0 && (
          <div className="flex gap-2 animate-scale-in">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 text-slate-900 shadow-sm">
                  Bulk Actions ({selectedUsers.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                <DropdownMenuItem className="hover:bg-white/5 cursor-pointer">
                  <UserCheck className="w-4 h-4 mr-2 text-emerald-400" />
                  Verify Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem className="hover:bg-white/5 cursor-pointer text-rose-400" onClick={() => onBanUser(selectedUsers[0])}>
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  Ban Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="ghost" 
              onClick={() => setSelectedUsers([])}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            >
              Clear
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                {permissions.canBanUsers && (
                  <TableHead className="w-12 pl-6">
                    <Checkbox
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onCheckedChange={(checked) => {
                        setSelectedUsers(checked ? users.map((u) => u.id) : []);
                      }}
                      className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </TableHead>
                )}
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest whitespace-nowrap">User Profile</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-center whitespace-nowrap">Status</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-center whitespace-nowrap">Products</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest whitespace-nowrap">Joined Date</TableHead>
                <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-widest text-right pr-6 whitespace-nowrap">Management</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors group">
                  {permissions.canBanUsers && (
                    <TableCell className="pl-6">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                          }
                        }}
                        className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </TableCell>
                  )}
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-slate-100 group-hover:border-violet-500/50 transition-colors shadow-sm">
                          {user.avatar_url ? (
                            <AvatarImage src={user.avatar_url} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-violet-600/10 to-cyan-600/10 text-violet-600 font-bold">
                              {user.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 tracking-tight">{user.full_name || 'Anonymous User'}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-medium">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={`rounded-full px-3 py-0.5 text-[10px] tracking-wider uppercase font-black border-none ${
                        user.status === "active"
                          ? "bg-emerald-50 text-emerald-600"
                          : user.status === "banned"
                            ? "bg-rose-50 text-rose-600"
                            : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-900">{user.products_count || 0}</span>
                      <span className="text-[10px] uppercase text-slate-400 tracking-widest font-bold">Units</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-xs text-slate-500 font-medium">{new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  </TableCell>
                  <TableCell className="text-right pr-6 whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewUser(user)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600 hover:bg-violet-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {permissions.canBanUsers && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border-slate-200 text-slate-900 shadow-xl">
                            {user.status === "active" ? (
                              <>
                                <DropdownMenuItem className="hover:bg-slate-50 cursor-pointer" onClick={() => onSuspendUser(user.id)}>
                                  <Ban className="h-4 w-4 mr-2 text-slate-500" />
                                  Suspend User
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-rose-50 cursor-pointer text-rose-600" onClick={() => onBanUser(user.id)}>
                                  <ShieldAlert className="h-4 w-4 mr-2" />
                                  Permanent Ban
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem className="hover:bg-emerald-50 cursor-pointer text-emerald-600" onClick={() => onUnbanUser(user.id)}>
                                <Unlock className="h-4 w-4 mr-2" />
                                Revoke Restriction
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
