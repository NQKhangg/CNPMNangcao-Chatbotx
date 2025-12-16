import api from '@/lib/axios'

export const statisticsService = {
    getDashboard: async () => {
        const res = await api.get('/statistics/dashboard');
        return res.data;
    }
}