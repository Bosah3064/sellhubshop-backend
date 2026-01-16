import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp, Users, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface LeaderboardEntry {
    id: string;
    user_id: string;
    full_name: string;
    avatar_url?: string;
    total_referrals: number;
    completed_referrals: number;
    total_earned: number;
    rank: number;
}

export const ReferralLeaderboard = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month');

    useEffect(() => {
        loadLeaderboard();
        getCurrentUser();
    }, [timeframe]);

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
    };

    const loadLeaderboard = async () => {
        try {
            setLoading(true);

            // Calculate date filter based on timeframe
            let dateFilter = new Date();
            if (timeframe === 'week') {
                dateFilter.setDate(dateFilter.getDate() - 7);
            } else if (timeframe === 'month') {
                dateFilter.setDate(dateFilter.getDate() - 30);
            }

            // Get referral stats for all users
            const { data: referralsData, error } = await supabase
                .from('referrals')
                .select('referrer_id, status, reward_amount, created_at')
                .gte('created_at', timeframe === 'all' ? '2020-01-01' : dateFilter.toISOString());

            if (error) throw error;

            // Aggregate by user
            const userStats = new Map<string, { total: number; completed: number; earned: number }>();

            referralsData?.forEach((ref) => {
                const stats = userStats.get(ref.referrer_id) || { total: 0, completed: 0, earned: 0 };
                stats.total++;
                if (ref.status === 'completed') {
                    stats.completed++;
                    stats.earned += ref.reward_amount || 0;
                }
                userStats.set(ref.referrer_id, stats);
            });

            // Get user profiles
            const userIds = Array.from(userStats.keys());
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', userIds);

            // Combine data
            const leaderboardData: LeaderboardEntry[] = [];
            userStats.forEach((stats, userId) => {
                const profile = profiles?.find(p => p.id === userId);
                if (profile && stats.completed > 0) {
                    leaderboardData.push({
                        id: userId,
                        user_id: userId,
                        full_name: profile.full_name || 'Anonymous User',
                        avatar_url: profile.avatar_url,
                        total_referrals: stats.total,
                        completed_referrals: stats.completed,
                        total_earned: stats.earned,
                        rank: 0,
                    });
                }
            });

            // Sort by completed referrals and assign ranks
            leaderboardData.sort((a, b) => b.completed_referrals - a.completed_referrals);
            leaderboardData.forEach((entry, index) => {
                entry.rank = index + 1;
            });

            setLeaderboard(leaderboardData.slice(0, 10)); // Top 10
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-6 h-6 text-yellow-500" />;
            case 2:
                return <Medal className="w-6 h-6 text-gray-400" />;
            case 3:
                return <Award className="w-6 h-6 text-orange-600" />;
            default:
                return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
        }
    };

    const getRankBadge = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
            case 2:
                return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
            case 3:
                return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <Card className="p-6">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 bg-gradient-to-br from-white to-amber-50 border-2 border-amber-200">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-600" />
                            Referral Leaderboard
                        </h3>
                        <p className="text-gray-600">Top referrers this {timeframe}</p>
                    </div>

                    {/* Timeframe Selector */}
                    <div className="flex gap-2">
                        {(['week', 'month', 'all'] as const).map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${timeframe === tf
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-amber-50'
                                    }`}
                            >
                                {tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'All Time'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-amber-200 text-center">
                        <Users className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-gray-900">{leaderboard.length}</p>
                        <p className="text-xs text-gray-600">Active Referrers</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-amber-200 text-center">
                        <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-gray-900">
                            {leaderboard.reduce((sum, e) => sum + e.completed_referrals, 0)}
                        </p>
                        <p className="text-xs text-gray-600">Total Referrals</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-amber-200 text-center">
                        <Coins className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-gray-900">
                            KES {leaderboard.reduce((sum, e) => sum + e.total_earned, 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">Total Earned</p>
                    </div>
                </div>
            </div>

            {/* Leaderboard List */}
            <div className="space-y-3">
                {leaderboard.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No referrals yet. Be the first!</p>
                    </div>
                ) : (
                    leaderboard.map((entry) => (
                        <div
                            key={entry.id}
                            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${entry.user_id === currentUserId
                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 shadow-lg scale-105'
                                    : 'bg-white border border-gray-200 hover:shadow-md'
                                }`}
                        >
                            {/* Rank */}
                            <div className="flex-shrink-0 w-12 text-center">
                                {getRankIcon(entry.rank)}
                            </div>

                            {/* Avatar */}
                            <Avatar className="w-12 h-12 border-2 border-white shadow-md">
                                <AvatarImage src={entry.avatar_url} alt={entry.full_name} />
                                <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white font-bold">
                                    {entry.full_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-gray-900 truncate">
                                        {entry.full_name}
                                    </p>
                                    {entry.user_id === currentUserId && (
                                        <Badge className="bg-green-600 text-white text-xs">You</Badge>
                                    )}
                                    {entry.rank <= 3 && (
                                        <Badge className={`${getRankBadge(entry.rank)} text-xs`}>
                                            Top {entry.rank}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {entry.completed_referrals} referrals
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Coins className="w-3 h-3" />
                                        KES {entry.total_earned.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Rank Badge (Mobile) */}
                            <div className="flex-shrink-0 sm:hidden">
                                <Badge className={`${getRankBadge(entry.rank)}`}>
                                    #{entry.rank}
                                </Badge>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Motivation */}
            {currentUserId && !leaderboard.find(e => e.user_id === currentUserId) && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <p className="text-center text-purple-900 font-medium">
                        🚀 Start referring to join the leaderboard and compete for the top spot!
                    </p>
                </div>
            )}
        </Card>
    );
};
