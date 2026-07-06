import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class DbInsert {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/cinema_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
        String user = "root";
        String password = System.getenv("DB_PASSWORD");
        if (password == null) password = "";
        
        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            String hash = new BCryptPasswordEncoder().encode("admin");
            String sql = "INSERT INTO users (username, password, role, full_name, email, phone, loyalty_points) VALUES (?, ?, 'ADMIN', 'Test Admin', 'admin@test.com', '0123456789', 0)";
            try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                pstmt.setString(1, "testadmin");
                pstmt.setString(2, hash);
                pstmt.executeUpdate();
                System.out.println("Created testadmin/admin");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
