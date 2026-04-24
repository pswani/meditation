package com.meditation.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  private final CorsProperties corsProperties;
  private final MediaStorageProperties mediaStorageProperties;

  public WebConfig(CorsProperties corsProperties, MediaStorageProperties mediaStorageProperties) {
    this.corsProperties = corsProperties;
    this.mediaStorageProperties = mediaStorageProperties;
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    if (corsProperties.getAllowedOriginPatterns().isEmpty()) {
      return;
    }

    registry.addMapping("/api/**")
        .allowedOriginPatterns(corsProperties.getAllowedOriginPatterns().toArray(String[]::new))
        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        // Keep this list in sync with headers used by the web client; do not restore wildcard.
        .allowedHeaders(
            "Content-Type",
            "X-Meditation-Sync-Queued-At",
            "X-Requested-With"
        );
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry.addResourceHandler(mediaStorageProperties.getCustomPlayPublicPathPattern())
        .addResourceLocations(mediaStorageProperties.getCustomPlayResourceLocation());
    registry.addResourceHandler(mediaStorageProperties.getSoundPublicPathPattern())
        .addResourceLocations(mediaStorageProperties.getSoundResourceLocation());
  }
}
