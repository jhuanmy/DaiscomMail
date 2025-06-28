#!/bin/bash

# Configuración de Nginx y SSL para correopro.daiscom.com

USERNAME="daiscom"
DOMAIN="correopro.daiscom.com"
DOMAIN_PATH="/home/$USERNAME/$DOMAIN"

echo "🌐 Configurando Nginx y SSL para $DOMAIN"
echo "👤 Usuario: $USERNAME"
echo "📁 Ruta: $DOMAIN_PATH"
echo "================================"

if [ "$EUID" -ne 0 ]; then
  echo "❌ Este script debe ejecutarse como root"
  exit 1
fi

# Verificar que existe la estructura
if [ ! -d "$DOMAIN_PATH" ]; then
  echo "❌ No existe la estructura del dominio en $DOMAIN_PATH"
  echo "Ejecuta primero: sudo bash deploy/setup-daiscom.sh"
  exit 1
fi

# Verificar que existe el proyecto
if [ ! -f "$DOMAIN_PATH/package.json" ]; then
  echo "❌ No se encontró el proyecto ProMail en $DOMAIN_PATH"
  echo "Ejecuta primero: sudo bash deploy/clone-github.sh"
  exit 1
fi

# Configurar Nginx para correopro.daiscom.com
echo "⚙️ Configurando Nginx..."
cat > "/etc/nginx/sites-available/$DOMAIN" << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirigir HTTP a HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # Logs específicos del dominio
    access_log $DOMAIN_PATH/logs/access.log;
    error_log $DOMAIN_PATH/logs/error.log;
    
    # SSL (se configurará con certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Headers de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Servir archivos estáticos desde public_html
    location / {
        root $DOMAIN_PATH/public_html;
        try_files \$uri \$uri/ /index.html;
        
        # Cache para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Proxy para API del backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Límites de tamaño para uploads
    client_max_body_size 50M;
    
    # Protección adicional
    location ~ /\. {
        deny all;
    }
    
    location ~ ~$ {
        deny all;
    }
}
EOF

# Habilitar sitio
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/"

# Crear directorio de logs si no existe
mkdir -p "$DOMAIN_PATH/logs"
chown -R "$USERNAME:$USERNAME" "$DOMAIN_PATH/logs"

# Verificar configuración de Nginx
nginx -t

# Configurar firewall
echo "🔥 Configurando firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'

# Obtener certificado SSL
echo "🔒 Obteniendo certificado SSL para $DOMAIN..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@daiscom.com.co"

# Reiniciar servicios
systemctl reload nginx
systemctl enable nginx

# Guardar configuración
cat > "$DOMAIN_PATH/config/nginx.conf" << EOF
# Configuración Nginx para $DOMAIN
# Archivo: /etc/nginx/sites-available/$DOMAIN
# Logs: $DOMAIN_PATH/logs/
# SSL: /etc/letsencrypt/live/$DOMAIN/
# Configurado: $(date)
EOF

echo "✅ Nginx y SSL configurados correctamente!"
echo ""
echo "📁 Archivos de configuración:"
echo "  Nginx: /etc/nginx/sites-available/$DOMAIN"
echo "  Logs: $DOMAIN_PATH/logs/"
echo "  SSL: /etc/letsencrypt/live/$DOMAIN/"
echo ""
echo "📋 Próximo paso:"
echo "  sudo bash deploy/setup-credentials.sh"