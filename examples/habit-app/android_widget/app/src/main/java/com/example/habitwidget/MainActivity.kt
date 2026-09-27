package com.example.habitwidget
import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import java.net.URL
class MainActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val streak = URL("https://api.example.org/streak?key=" + BuildConfig.API_SECRET).readText()
    setContentView(TextView(this).apply { text = streak })
  }
}
