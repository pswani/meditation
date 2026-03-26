package com.meditation.backend.config;

import java.nio.file.Path;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "meditation.backend.media")
public class MediaStorageProperties {

  private String root = "../local-data/media";
  private String customPlaySubdirectory = "custom-plays";
  private String publicPathPrefix = "/media";

  public String getRoot() {
    return root;
  }

  public void setRoot(String root) {
    this.root = root;
  }

  public String getCustomPlaySubdirectory() {
    return customPlaySubdirectory;
  }

  public void setCustomPlaySubdirectory(String customPlaySubdirectory) {
    this.customPlaySubdirectory = customPlaySubdirectory;
  }

  public String getPublicPathPrefix() {
    return publicPathPrefix;
  }

  public void setPublicPathPrefix(String publicPathPrefix) {
    this.publicPathPrefix = publicPathPrefix;
  }

  public Path getRootPath() {
    return Path.of(root).normalize();
  }

  public Path getCustomPlayDirectoryPath() {
    return getRootPath().resolve(customPlaySubdirectory).normalize();
  }

  public String toPublicPath(String relativePath) {
    String normalizedPrefix = publicPathPrefix.endsWith("/")
        ? publicPathPrefix.substring(0, publicPathPrefix.length() - 1)
        : publicPathPrefix;
    String trimmedRelativePath = relativePath.startsWith("/")
        ? relativePath.substring(1)
        : relativePath;
    return normalizedPrefix + "/" + trimmedRelativePath;
  }

  public String getPublicPathPattern() {
    String normalizedPrefix = publicPathPrefix.endsWith("/")
        ? publicPathPrefix.substring(0, publicPathPrefix.length() - 1)
        : publicPathPrefix;
    return normalizedPrefix + "/**";
  }

  public String getRootResourceLocation() {
    String uri = getRootPath().toAbsolutePath().normalize().toUri().toString();
    return uri.endsWith("/") ? uri : uri + "/";
  }
}
