package com.meditation.backend;

import com.meditation.backend.config.CorsProperties;
import com.meditation.backend.config.MediaStorageProperties;
import com.meditation.backend.config.SyncProperties;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

@SpringBootApplication
@EnableConfigurationProperties({
    CorsProperties.class,
    MediaStorageProperties.class,
    SyncProperties.class,
})
public class MeditationBackendApplication {

  public static void main(String[] args) {
    SpringApplication.run(MeditationBackendApplication.class, args);
  }

  @Bean
  ApplicationRunner h2ProdGuard(
      @Value("${spring.datasource.url}") String datasourceUrl,
      Environment env) {
    return args -> {
      if (Arrays.asList(env.getActiveProfiles()).contains("prod")
          && datasourceUrl.contains(":h2:")) {
        throw new IllegalStateException(
            "H2 datasource detected on 'prod' profile. "
            + "Set spring.datasource.url to a production-grade datasource.");
      }
    };
  }
}
