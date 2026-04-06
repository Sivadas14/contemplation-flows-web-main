import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  UserPlus, 
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { dashboardAPI } from '@/apis/api';
import { DashboardCount, PlanDistributionItem, RecentUserItem } from '@/apis/wire';

interface DashboardStat {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
  trend: 'up' | 'down';
}

interface FormattedUser {
  id: number | string;
  name: string;
  email: string;
  plan: string;
  planType: string;
  joinedAt: string;
  status: string;
}

const Dashboard: React.FC = () => {
  const [count, setCount] = useState<DashboardCount | null>(null);
  const [planDistribution, setPlanDistribution] = useState<PlanDistributionItem[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUserItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const [countRes, planRes, usersRes] = await Promise.all([
        dashboardAPI.getCount(),
        dashboardAPI.getPlanDistribution(),
        dashboardAPI.getRecentUsers(10, 7),
      ]);
      
      console.log('API Response:', { countRes, planRes, usersRes });
      
      setCount(countRes);
      setPlanDistribution(planRes);
      setRecentUsers(usersRes || []);
      
      // 模拟交易数据
      setRecentTransactions([
        { id: 1, user: 'John Doe', amount: '$49.99', plan: 'Pro Monthly', date: '2 hours ago', status: 'completed' },
        { id: 2, user: 'Sarah Smith', amount: '$199.99', plan: 'Enterprise Monthly', date: '5 hours ago', status: 'completed' },
        { id: 3, user: 'Emily Brown', amount: '$49.99', plan: 'Pro Monthly', date: '1 day ago', status: 'completed' },
        { id: 4, user: 'Alex Turner', amount: '$499.99', plan: 'Enterprise Yearly', date: '2 days ago', status: 'completed' },
        { id: 5, user: 'Lisa Anderson', amount: '$49.99', plan: 'Pro Monthly', date: '3 days ago', status: 'pending' },
      ]);
      
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 根据实际 API 响应调整统计数据
  const stats: DashboardStat[] = [
    {
      title: 'Total Users',
      value: count?.total_users?.toLocaleString() || '0',
      icon: <Users className="w-6 h-6 text-blue-600" />,
      change: '+12% from last month',
      trend: 'up'
    },
    {
      title: 'Active Subscriptions',
      value: count?.active_subscriptions?.toLocaleString() || '0',
      icon: <CreditCard className="w-6 h-6 text-green-600" />,
      change: '+5% from last month',
      trend: 'up'
    },
    {
      title: 'Total Revenue',
      value: `$${count?.total_revenue?.this_month?.toLocaleString() || '0'}`,
      icon: <DollarSign className="w-6 h-6 text-orange-600" />,
      change: `$${count?.total_revenue?.month_over_month_pct || 0}% from last month`,
      trend: count?.total_revenue?.month_over_month_pct >= 0 ? 'up' : 'down'
    },
    {
      title: 'Active Sessions',
      value: count?.active_sessions_last_hour?.toLocaleString() || '0',
      icon: <Activity className="w-6 h-6 text-purple-600" />,
      change: '+8% from last hour',
      trend: 'up'
    },
  ];

  // 格式化最近用户数据 - 修复 plan_type 问题
  const formatRecentUsers = (): FormattedUser[] => {
    if (!recentUsers || recentUsers.length === 0) return [];
    
    return recentUsers.map(user => ({
      id: user.id || Date.now() + Math.random(),
      name: user.name || 'Unknown User',
      email: user.email || 'No email',
      plan: user.plan_type || 'FREE', // 使用 plan_type 而不是 plan
      planType: user.plan_type || 'FREE',
      joinedAt: formatTimeAgo(new Date(user.created_at || new Date())),
      status: user.status || 'active'
    }));
  };

  // 格式化时间
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // 获取计划颜色 - 添加防御性编程
  const getPlanColor = (plan?: string): string => {
    if (!plan) return 'bg-gray-100 text-gray-700';
    
    const planLower = plan.toLowerCase();
    switch (planLower) {
      case 'enterprise':
        return 'bg-orange-100 text-orange-700';
      case 'pro':
      case 'basic':
        return 'bg-blue-100 text-blue-700';
      case 'premium':
        return 'bg-purple-100 text-purple-700';
      case 'free':
        return 'bg-gray-200 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg font-semibold">Error Loading Dashboard</p>
          <p className="text-gray-600 mt-2">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formattedUsers = formatRecentUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'} mt-1 flex items-center gap-1`}>
                <TrendingUp className={`w-3 h-3 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {planDistribution.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No plan distribution data available</p>
          ) : (
            <div className="space-y-4">
              {planDistribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.plan_type || 'Unknown'}</span>
                    <span className="text-gray-500">
                      {item.count?.toLocaleString()} users ({item.pct || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (item.plan_type || '').toLowerCase() === 'free' ? 'bg-gray-500' :
                        (item.plan_type || '').toLowerCase() === 'basic' ? 'bg-blue-500' :
                        (item.plan_type || '').toLowerCase() === 'pro' ? 'bg-green-500' :
                        (item.plan_type || '').toLowerCase() === 'enterprise' ? 'bg-orange-500' :
                        'bg-purple-500'
                      }`}
                      style={{ width: `${item.pct || 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formattedUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent users</p>
            ) : (
              <div className="space-y-4">
                {formattedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPlanColor(user.plan)}`}>
                        {user.plan}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{user.joinedAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent transactions</p>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{transaction.user}</p>
                      <p className="text-xs text-gray-500">{transaction.plan}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {transaction.amount}
                      </p>
                      <p className="text-xs text-gray-500">{transaction.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;