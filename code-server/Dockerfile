FROM debian:bookworm-slim

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install all necessary system dependencies in one layer, including gosu and sudo
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    gosu \
    sudo \
    build-essential \
    openjdk-17-jdk \
    python3 \
    python3-pip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install a modern version of Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install code-server
ARG CS_VERSION="4.91.1"
ARG TARGETARCH="amd64"
RUN curl -fL "https://github.com/coder/code-server/releases/download/v${CS_VERSION}/code-server-${CS_VERSION}-linux-${TARGETARCH}.tar.gz" \
    | tar -C /usr/lib -xz && \
    mv "/usr/lib/code-server-${CS_VERSION}-linux-${TARGETARCH}" /usr/lib/code-server && \
    ln -s /usr/lib/code-server/bin/code-server /usr/bin/code-server

# Create the non-root user and the project directory
RUN useradd --create-home --shell /bin/bash --uid 1000 coder && \
    mkdir -p /home/coder/project && \
    chown -R coder:coder /home/coder

# Create extensions directory
RUN mkdir -p /home/coder/extensions-temp && chown coder:coder /home/coder/extensions-temp

# Copy all files from extensions directory
COPY --chown=coder:coder extensions/ /home/coder/extensions-temp/

# Install extensions as coder user
USER coder
RUN if ls /home/coder/extensions-temp/*.vsix 1> /dev/null 2>&1; then \
        for ext in /home/coder/extensions-temp/*.vsix; do \
            echo "Installing extension: $ext"; \
            code-server --install-extension "$ext" || echo "Failed to install $ext"; \
        done; \
        echo "Extensions installed successfully"; \
    else \
        echo "No .vsix extensions found to install"; \
    fi && \
    rm -rf /home/coder/extensions-temp

USER root

# Copy the entrypoint script and make it executable
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set the working directory
WORKDIR /home/coder/project

# Expose the correct code-server port
EXPOSE 8443

# Use the entrypoint to fix permissions and switch user before starting
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# The command that the entrypoint will execute AS THE CODER USER
CMD ["code-server", "--auth", "none", "--bind-addr", "0.0.0.0:8443", "--disable-workspace-trust", "."]