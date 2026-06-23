package com.cinema.ticketsystem.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class RevenueStatsResponse {
    private List<MonthlyRevenue> monthlyData;
    private List<MovieRevenue> movieRevenue;

    @Data
    public static class MonthlyRevenue {
        private String month;
        private BigDecimal revenue;
        private long tickets;
        private BigDecimal avg;

        public MonthlyRevenue(String month, BigDecimal revenue, long tickets, BigDecimal avg) {
            this.month = month;
            this.revenue = revenue;
            this.tickets = tickets;
            this.avg = avg;
        }
    }

    @Data
    public static class MovieRevenue {
        private String movie;
        private BigDecimal revenue;
        private long tickets;

        public MovieRevenue(String movie, BigDecimal revenue, long tickets) {
            this.movie = movie;
            this.revenue = revenue;
            this.tickets = tickets;
        }
    }
}
