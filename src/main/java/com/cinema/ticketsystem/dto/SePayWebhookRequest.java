package com.cinema.ticketsystem.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class SePayWebhookRequest {
    
    private String id;
    private String gateway;
    private String code;         // Mã đơn hàng (VD: DH10293)
    private Long transferAmount; // Số tiền (VD: 5000000)
    private String transferType; // "in" hoặc "out"
    private String referenceCode;// Mã giao dịch ngân hàng
    
    @JsonProperty("transactionDate")
    private String transactionDate;

    // --- GETTERS & SETTERS ---
    // (Nếu dự án bạn có dùng thư viện Lombok, chỉ cần thêm annotation @Data ở đầu class là không cần viết Getter/Setter)
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Long getTransferAmount() { return transferAmount; }
    public void setTransferAmount(Long transferAmount) { this.transferAmount = transferAmount; }

    public String getTransferType() { return transferType; }
    public void setTransferType(String transferType) { this.transferType = transferType; }

    public String getReferenceCode() { return referenceCode; }
    public void setReferenceCode(String referenceCode) { this.referenceCode = referenceCode; }
}