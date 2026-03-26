package com.meditation.backend;

import com.meditation.backend.config.CorsProperties;
import com.meditation.backend.config.MediaStorageProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({
    CorsProperties.class,
    MediaStorageProperties.class,
})
public class MeditationBackendApplication {

  public static void main(String[] args) {
    SpringApplication.run(MeditationBackendApplication.class, args);
  }
}
