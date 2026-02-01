import { useMarketStats } from "@/hooks/useMarketStats";
import { Users, ShoppingBag, TrendingUp, ShieldCheck } from "lucide-react";

export const HomeStats = () => {
  const { stats, loading } = useMarketStats();

  if (loading) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-8 animate-fade-in">
      <StatCard 
        icon={Users} 
        label="Active Users" 
        value={stats.totalUsers.toLocaleString()} 
        color="text-blue-600"
        bg="bg-blue-50"
      />
      <StatCard 
        icon={ShoppingBag} 
        label="Products Listed" 
        value={stats.activeProducts.toLocaleString()} 
        color="text-emerald-600"
        bg="bg-emerald-50"
      />
      <StatCard 
        icon={TrendingUp} 
        label="Market Interaction" 
        value={stats.totalVolume.toLocaleString() + "+"} 
        color="text-purple-600"
        bg="bg-purple-50"
      />
      <StatCard 
        icon={ShieldCheck} 
        label="Verified Sellers" 
        value="100%" 
        color="text-amber-600"
        bg="bg-amber-50"
      />
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }: any) => (
  <div className="bg-white/60 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 group hover:-translate-y-1">
    <div className={`p-3 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
    </div>
  </div>
);
