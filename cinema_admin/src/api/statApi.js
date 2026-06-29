import axiosClient from './axiosClient';

const statApi = {
    getDashboardStats() {
        const url = '/admin/stats/dashboard';
        return axiosClient.get(url);
    },
    
    getRevenueStats() {
        const url = '/admin/stats/revenue';
        return axiosClient.get(url);
    }
};

export default statApi;
