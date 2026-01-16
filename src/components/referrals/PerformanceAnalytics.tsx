import { Card } from '@/components/ui/card';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, MousePointer2, UserCheck, Wallet, TrendingUp } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface PerformanceAnalyticsProps {
    referrals: any[]; // In a real app, this would be typed properly
}

export const PerformanceAnalytics = ({ referrals }: PerformanceAnalyticsProps) => {
    // Mock data for visualization (since we don't have click tracking in DB yet)
    const stats = {
        clicks: 142,
        signups: referrals.length || 12,
        conversionRate: referrals.length ? ((referrals.length / 142) * 100).toFixed(1) : '8.5',
        velocity: 'High'
    };

    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Link Clicks',
                data: [12, 19, 3, 5, 20, 35, 48],
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true,
            },
            {
                label: 'Signups',
                data: [1, 2, 0, 1, 4, 6, 8],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    display: false,
                }
            },
            x: {
                grid: {
                    display: false,
                }
            }
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        }
    };

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-l-indigo-500 bg-white shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Clicks</p>
                    <div className="flex items-center gap-2">
                        <MousePointer2 className="w-5 h-5 text-indigo-500" />
                        <span className="text-2xl font-bold text-gray-900">{stats.clicks}</span>
                    </div>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +12% this week
                    </p>
                </Card>

                <Card className="p-4 border-l-4 border-l-green-500 bg-white shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Signups</p>
                    <div className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-green-500" />
                        <span className="text-2xl font-bold text-gray-900">{stats.signups}</span>
                    </div>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +4 new!
                    </p>
                </Card>

                <Card className="p-4 border-l-4 border-l-yellow-500 bg-white shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Conversion Rate</p>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-yellow-500" />
                        <span className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</span>
                    </div>
                    <Badge variant="secondary" className="mt-1 text-xs bg-yellow-100 text-yellow-800">
                        Top 10%
                    </Badge>
                </Card>

                <Card className="p-4 border-l-4 border-l-purple-500 bg-white shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Est. Value</p>
                    <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-purple-500" />
                        <span className="text-2xl font-bold text-gray-900">KES 4.5k</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Potential earnings
                    </p>
                </Card>
            </div>

            {/* detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <Card className="col-span-1 lg:col-span-2 p-6 bg-white border-2 border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900">Traffic Overview</h3>
                        <select className="text-sm border-gray-200 rounded-md p-1 bg-gray-50">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <Line data={chartData} options={options} />
                </Card>

                {/* Hidden Insights Panel */}
                <Card className="p-6 bg-gradient-to-b from-slate-900 to-slate-800 text-white border-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>

                    <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        AI Insights
                    </h3>

                    <div className="space-y-6 relative z-10">
                        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                            <p className="text-xs text-indigo-300 uppercase font-semibold mb-2">Best Performing Channel</p>
                            <div className="flex justify-between items-center">
                                <span className="font-bold">WhatsApp Status</span>
                                <Badge className="bg-green-500">45% Conv.</Badge>
                            </div>
                            <p className="text-sm text-slate-300 mt-2">
                                Your WhatsApp shares are converting 2x better than Twitter. Focus here!
                            </p>
                        </div>

                        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                            <p className="text-xs text-indigo-300 uppercase font-semibold mb-2">Lost Opportunity</p>
                            <div className="flex justify-between items-center">
                                <span className="font-bold">Weekend Dip</span>
                                <Badge variant="destructive">-20% Traffic</Badge>
                            </div>
                            <p className="text-sm text-slate-300 mt-2">
                                You get fewer clicks on Saturdays. Try posting at 10 AM on Saturday mornings.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
