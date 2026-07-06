import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.security.Key;

public class JwtGen {
    public static void main(String[] args) {
        String secret = "5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437";
        String username = "ngocgiau";
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", "ROLE_ADMIN");
        extraClaims.put("userId", 1);
        
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        Key signInKey = Keys.hmacShaKeyFor(keyBytes);
        
        String token = Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24))
                .signWith(signInKey, SignatureAlgorithm.HS256)
                .compact();
                
        System.out.println(token);
    }
}
