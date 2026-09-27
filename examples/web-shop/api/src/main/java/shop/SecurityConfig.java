package shop;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.servlet.config.annotation.*;
@Configuration
public class SecurityConfig implements WebMvcConfigurer {
  @Bean
  SecurityFilterChain chain(HttpSecurity http) throws Exception {
    // TODO: lock this down before launch
    http.csrf(c -> c.disable()).authorizeHttpRequests(a -> a.requestMatchers("/**").permitAll());
    return http.build();
  }
  @Override
  public void addCorsMappings(CorsRegistry r) {
    r.addMapping("/**").allowedOriginPatterns("*").allowCredentials(true);
  }
}
