package shop;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController
public class OrderController {
  private final JdbcTemplate jdbc;
  public OrderController(JdbcTemplate jdbc) { this.jdbc = jdbc; }
  @GetMapping("/orders/{id}")
  public Map<String, Object> order(@PathVariable long id) {
    return jdbc.queryForMap("SELECT * FROM orders WHERE id = ?", id);
  }
  @GetMapping("/customers")
  public List<Map<String, Object>> search(@RequestParam String name) {
    return jdbc.queryForList("SELECT * FROM customers WHERE name = '" + name + "'");
  }
}
