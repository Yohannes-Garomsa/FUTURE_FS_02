import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/store";
import { leadsAPI } from "../../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  CalendarIcon,
  UsersIcon,
  PhoneIcon,
  MailIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0,
    lostLeads: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [leadsResponse, activitiesResponse] = await Promise.all([
        leadsAPI.getLeads(),
        activitiesAPI.getActivities(),
      ]);

      const leads = leadsResponse.data;
      setStats({
        totalLeads: leads.length,
        newLeads: leads.filter((l) => l.status === "new").length,
        contactedLeads: leads.filter((l) => l.status === "contacted").length,
        qualifiedLeads: leads.filter((l) => l.status === "qualified").length,
        convertedLeads: leads.filter((l) => l.status === "converted").length,
        lostLeads: leads.filter((l) => l.status === "lost").length,
      });

      const chartData = [
        { name: "New", value: leads.filter((l) => l.status === "new").length },
        {
          name: "Contacted",
          value: leads.filter((l) => l.status === "contacted").length,
        },
        {
          name: "Qualified",
          value: leads.filter((l) => l.status === "qualified").length,
        },
        {
          name: "Converted",
          value: leads.filter((l) => l.status === "converted").length,
        },
        {
          name: "Lost",
          value: leads.filter((l) => l.status === "lost").length,
        },
      ];
      setChartData(chartData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      id: 1,
      title: "Total Leads",
      value: stats.totalLeads,
      icon: UsersIcon,
      color: "bg-blue-500",
    },
    {
      id: 2,
      title: "New Leads",
      value: stats.newLeads,
      icon: CalendarIcon,
      color: "bg-green-500",
    },
    {
      id: 3,
      title: "Contacted",
      value: stats.contactedLeads,
      icon: MailIcon,
      color: "bg-yellow-500",
    },
    {
      id: 4,
      title: "Qualified",
      value: stats.qualifiedLeads,
      icon: PhoneIcon,
      color: "bg-purple-500",
    },
    {
      id: 5,
      title: "Converted",
      value: stats.convertedLeads,
      icon: UsersIcon,
      color: "bg-indigo-500",
    },
    {
      id: 6,
      title: "Lost",
      value: stats.lostLeads,
      icon: UsersIcon,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back, {user?.name}!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat) => (
          <div
            key={stat.id}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div
                  className={`flex-shrink-0 bg-white rounded-full p-3 ${stat.color}`}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Leads by Status
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
