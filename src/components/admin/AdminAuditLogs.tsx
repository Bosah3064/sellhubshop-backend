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
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Clock, User, Shield, Info } from 'lucide-react';

interface AuditLog {
  id: string;
  admin_id: string;
  action_type: string;
  resource_type: string;
  resource_id: string;
  details: any;
  created_at: string;
  admin_email?: string;
}

interface AdminAuditLogsProps {
  logs: AuditLog[];
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({ logs }) => {
  const getActionColor = (type: string) => {
    if (type.includes('delete') || type.includes('ban') || type.includes('reject')) return 'text-rose-600 bg-rose-50';
    if (type.includes('create') || type.includes('approve') || type.includes('verify')) return 'text-emerald-600 bg-emerald-50';
    if (type.includes('update') || type.includes('edit')) return 'text-amber-600 bg-amber-50';
    return 'text-violet-600 bg-violet-50';
  };

  return (
    <Card className="admin-glass border-none animate-fade-in shadow-2xl">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-slate-900 text-xl flex items-center">
              <Shield className="w-5 h-5 mr-2 text-violet-500" />
              Security Audit Trails
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Immutable record of all administrative actions performed on the platform
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-slate-200 text-slate-500 font-mono text-[10px]">
            {logs.length} ACTIONS RECORDED
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="text-slate-500 font-medium pl-6">Timestamp</TableHead>
                <TableHead className="text-slate-500 font-medium">Administrator</TableHead>
                <TableHead className="text-slate-500 font-medium">Action & Resource</TableHead>
                <TableHead className="text-slate-500 font-medium">Log Details</TableHead>
                <TableHead className="text-slate-500 font-medium pr-6 text-right">Reference ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-slate-300 italic">
                    No security events captured in the current period.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="border-slate-100 hover:bg-slate-50 transition-colors group">
                    <TableCell className="pl-6">
                      <div className="flex items-center text-xs text-slate-500">
                        <Clock className="w-3 h-3 mr-2 text-slate-300" />
                        {new Date(log.created_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-violet-600" />
                        </div>
                        <span className="text-sm text-slate-900 font-medium">{log.admin_email || 'System'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <Badge className={`w-fit rounded-sm px-1.5 py-0 text-[10px] uppercase font-bold border-none mb-1 ${getActionColor(log.action_type)}`}>
                          {log.action_type.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-[10px] uppercase text-slate-400 tracking-widest font-bold flex items-center">
                          <Info className="w-2 h-2 mr-1" />
                          {log.resource_type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate hover:whitespace-normal hover:overflow-visible hover:bg-white hover:border hover:border-slate-200 hover:p-2 hover:rounded hover:z-20 hover:relative hover:shadow-xl transition-all">
                        <code className="text-[11px] text-slate-500 font-mono">
                          {JSON.stringify(log.details)}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <span className="text-[10px] font-mono text-slate-400">{log.resource_id.substring(0, 8)}...</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
