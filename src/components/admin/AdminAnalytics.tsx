import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface AnalyticsProps {
  stats: any;
  revenueData: any[];
  userGrowthData: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AdminAnalytics: React.FC<AnalyticsProps> = ({ stats, revenueData, userGrowthData }) => {
  
  const kpiCards = [
    {
      title: "Total Revenue",
      value: `KES ${stats.totalRevenue.toLocaleString()}`,
      change: `+${stats.weeklyGrowth}%`,
      icon: DollarSign,
      color: "var(--admin-primary)",
      trend: "up"
    },
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      change: `+${stats.todayRegistrations} today`,
      icon: Users,
      color: "var(--admin-secondary)",
      trend: "up"
    },
    {
      title: "Active Products",
      value: stats.approvedProducts.toLocaleString(),
      change: `${stats.pendingProducts} pending`,
      icon: ShoppingCart,
      color: "var(--admin-accent)",
      trend: "neutral"
    },
    {
      title: "User Engagement",
      value: `${stats.userEngagement.toFixed(1)}%`,
      change: "-2.1%",
      icon: Activity,
      color: "#ff4d4d",
      trend: "down"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <Card key={index} className="admin-glass border-none hover-lift overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <h3 className="text-2xl font-bold mt-1 text-slate-900">{card.value}</h3>
                  <div className={`flex items-center mt-2 text-xs font-medium ${
                    card.trend === 'up' ? 'text-emerald-600' : card.trend === 'down' ? 'text-rose-600' : 'text-violet-600'
                  }`}>
                    {card.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : card.trend === 'down' ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                    {card.change}
                    <span className="text-slate-400 ml-1 font-normal text-[10px]">vs last period</span>
                  </div>
                </div>
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${card.color}15` }}>
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
              </div>
            </CardContent>
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${card.color}44, ${card.color}00)` }} />
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 admin-glass border-none">
          <CardHeader>
            <CardTitle className="text-slate-900 text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
              Revenue Performance
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Real-time monthly revenue trends</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--admin-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--admin-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 12 }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '12px',
                    color: '#0f172a',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--admin-primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="admin-glass border-none">
          <CardHeader>
            <CardTitle className="text-slate-900 text-lg">User Growth</CardTitle>
            <CardDescription className="text-slate-500 text-xs">New registrations by month</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="users" radius={[4, 4, 0, 0]}>
                  {userGrowthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === userGrowthData.length - 1 ? 'var(--admin-secondary)' : 'var(--admin-primary)'} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* More charts would go here */}
    </div>
  );
};
