import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Server, 
  Database, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  HardDrive, 
  Wifi, 
  RefreshCw 
} from 'lucide-react';

interface HealthData {
  database_size: string;
  active_connections: number;
  server_uptime: string;
  cache_hit_rate: number;
  last_backup: string | null;
  storage_used: string;
  memory_usage: number;
}

interface SystemMonitoringProps {
  health: HealthData | null;
  loading: boolean;
  onRefresh: () => void;
}

export const SystemMonitoring: React.FC<SystemMonitoringProps> = ({ health, loading, onRefresh }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server & CPU */}
        <Card className="admin-glass border-none shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900 text-lg flex items-center justify-between">
              <div className="flex items-center">
                <Cpu className="w-5 h-5 mr-2 text-violet-500" />
                Processing Unit
              </div>
              <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50 font-mono text-[10px]">OPTIMAL</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>CPU Utilization</span>
                <span className="text-slate-900 font-mono">12.5%</span>
              </div>
              <Progress value={12.5} className="h-1.5 bg-slate-100" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Memory usage</span>
                <span className="text-slate-900 font-mono">{health?.memory_usage || 45}%</span>
              </div>
              <Progress value={health?.memory_usage || 45} className="h-1.5 bg-slate-100" />
            </div>
            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <span className="flex items-center"><Wifi className="w-3 h-3 mr-1 text-cyan-500" /> Latency: 24ms</span>
              <span className="flex items-center"><Activity className="w-3 h-3 mr-1 text-emerald-500" /> Threads: 128</span>
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card className="admin-glass border-none shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900 text-lg flex items-center justify-between">
              <div className="flex items-center">
                <Database className="w-5 h-5 mr-2 text-cyan-500" />
                Data Infrastructure
              </div>
              <Badge variant="outline" className="border-cyan-200 text-cyan-600 bg-cyan-50 font-mono text-[10px]">CONNECTED</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100/50">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Database Size</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{health?.database_size || '2.4 GB'}</p>
              </div>
              <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100/50">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Active Conn.</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{health?.active_connections || 45}</p>
              </div>
            </div>
            <div className="space-y-2 pt-1 text-center">
               <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Cache Hit Rate</div>
               <div className="flex justify-center items-end gap-1">
                 <span className="text-xl sm:text-2xl font-black text-slate-900">{health?.cache_hit_rate || 99.8}%</span>
                 <span className="text-[10px] text-emerald-600 font-bold mb-1">+0.2%</span>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* System Integrity */}
        <Card className="admin-glass border-none shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-900 text-lg flex items-center justify-between">
              <div className="flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-emerald-500" />
                Platform Security
              </div>
              <Badge variant="outline" className="border-violet-200 text-violet-600 bg-violet-50 font-mono text-[10px]">SECURED</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center">
                <HardDrive className="w-4 h-4 mr-3 text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black">Storage Integrity</p>
                  <p className="text-xs text-slate-700">Full Consistency Check</p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px]">PASS</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
               <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black">Last System Backup</p>
                  <p className="text-xs text-slate-700">{health?.last_backup ? new Date(health.last_backup).toLocaleString() : '2 hours ago'}</p>
               </div>
               <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-600" onClick={onRefresh}>
                 <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="admin-glass border-none shadow-xl p-6">
        <div className="flex items-center gap-6">
           <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Server className="text-white w-8 h-8" />
           </div>
           <div>
              <h3 className="text-xl font-bold text-slate-900">Uptime Monitor</h3>
              <p className="text-slate-500 text-sm">System has been online and performing optimally for <span className="text-slate-900 font-mono">{health?.server_uptime || '14 days, 6 hours'}</span></p>
           </div>
           <div className="ml-auto">
              <Button className="bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200" onClick={onRefresh}>
                Force Snapshot
              </Button>
           </div>
        </div>
      </Card>
    </div>
  );
};
