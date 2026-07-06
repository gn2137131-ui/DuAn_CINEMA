import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.ResultSetMetaData;

public class DbCheck {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/cinema_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
        String user = "root";
        String password = System.getenv("DB_PASSWORD");
        if (password == null) password = "";
        
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("--- ACHIEVEMENTS ---");
            ResultSet rs1 = stmt.executeQuery("SELECT * FROM achievements LIMIT 1");
            ResultSetMetaData meta1 = rs1.getMetaData();
            for (int i=1; i<=meta1.getColumnCount(); i++) {
                System.out.println(meta1.getColumnName(i));
            }

            System.out.println("--- USERS ---");
            ResultSet rs2 = stmt.executeQuery("SELECT * FROM users LIMIT 1");
            ResultSetMetaData meta2 = rs2.getMetaData();
            for (int i=1; i<=meta2.getColumnCount(); i++) {
                System.out.println(meta2.getColumnName(i));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
