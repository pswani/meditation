package com.meditation.backend.config;

import com.meditation.backend.sync.SyncClockSkewInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  private final CorsProperties corsProperties;
  private final MediaStorageProperties mediaStorageProperties;
  private final SyncClockSkewInterceptor syncClockSkewInterceptor;

  public WebConfig(
      CorsProperties corsProperties,
      MediaStorageProperties mediaStorageProperties,
      SyncClockSkewInterceptor syncClockSkewInterceptor) {
    this.corsProperties = corsProperties;
    this.mediaStorageProperties = mediaStorageProperties;
    this.syncClockSkewInterceptor = syncClockSkewInterceptor;
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
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(syncClockSkewInterceptor).addPathPatterns("/api/**");
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry.addResourceHandler(mediaStorageProperties.getCustomPlayPublicPathPattern())
        .addResourceLocations(mediaStorageProperties.getCustomPlayResourceLocation());
    registry.addResourceHandler(mediaStorageProperties.getSoundPublicPathPattern())
        .addResourceLocations(mediaStorageProperties.getSoundResourceLocation());
  }
}
