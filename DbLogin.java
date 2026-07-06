import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbLogin {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/cinema_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
        String user = "root";
        String password = System.getenv("DB_PASSWORD");
        if (password == null) password = "";
        
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            ResultSet rs = stmt.executeQuery("SELECT username, password FROM users WHERE role='ADMIN' LIMIT 1");
            if (rs.next()) {
                System.out.println("User: " + rs.getString("username"));
                System.out.println("Hash: " + rs.getString("password"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
