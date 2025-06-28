#!/bin/bash

# Script para configurar credenciales IMAP/SMTP para daiscom

USERNAME="daiscom"
DOMAIN="correopro.daiscom.com"
DOMAIN_PATH="/home/$USERNAME/$DOMAIN"
ENV_FILE="$DOMAIN_PATH/backend/.env"

echo "⚙️ Configuración de credenciales IMAP/SMTP"
echo "🌐 Dominio: $DOMAIN"
echo "📁 Archivo: $ENV_FILE"
echo "=========================================="

if [ "$EUID" -ne 0 ]; then
  echo "❌ Este script debe ejecutarse como root"
  exit 1
fi

# Verificar que existe la estructura
if [ ! -d "$DOMAIN_PATH" ]; then
  echo "❌ No existe la estructura del dominio en $DOMAIN_PATH"
  exit 1
fi

# Función para solicitar input
ask_input() {
  local prompt="$1"
  local default="$2"
  local var_name="$3"
  local is_password="$4"
  
  if [ "$is_password" = "true" ]; then
    read -s -p "$prompt: " input
    echo ""
  else
    if [ -n "$default" ]; then
      read -p "$prompt [$default]: " input
      input=${input:-$default}
    else
      read -p "$prompt: " input
    fi
  fi
  
  eval "$var_name='$input'"
}

echo "📧 Configurando servidor de correo para daiscom..."
echo ""
echo "Configurando servidor IMAP..."
ask_input "Host IMAP" "host-srv-901.daiscom.com.co" IMAP_HOST
ask_input "Puerto IMAP" "143" IMAP_PORT
ask_input "Usuario IMAP (email completo)" "" IMAP_USER
ask_input "Contraseña IMAP" "" IMAP_PASSWORD true

echo ""
echo "Configurando servidor SMTP..."
ask_input "Host SMTP" "host-srv-901.daiscom.com.co" SMTP_HOST
ask_input "Puerto SMTP" "25" SMTP_PORT
ask_input "Usuario SMTP (email completo)" "$IMAP_USER" SMTP_USER
ask_input "Contraseña SMTP" "$IMAP_PASSWORD" SMTP_PASSWORD true

# Crear archivo .env
cat > "$ENV_FILE" << EOF
# Configuración del servidor de correo para daiscom
IMAP_HOST=$IMAP_HOST
IMAP_PORT=$IMAP_PORT
IMAP_SECURE=false
IMAP_USER=$IMAP_USER
IMAP_PASSWORD=$IMAP_PASSWORD

# Configuración SMTP
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_SECURE=false
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD

# Configuración de la aplicación
PORT=3001
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)

# Configuración de seguridad
CORS_ORIGIN=https://$DOMAIN
SESSION_SECRET=$(openssl rand -base64 32)

# Configuración de archivos
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=25MB

# Configuración de logs
LOG_LEVEL=info
LOG_FILE=$DOMAIN_PATH/logs/promail.log

# Configuración específica daiscom
COMPANY_NAME=Daiscom
COMPANY_DOMAIN=daiscom.com.co
ADMIN_EMAIL=admin@daiscom.com.co
EOF

# Cambiar propietario y permisos
chown "$USERNAME:$USERNAME" "$ENV_FILE"
chmod 600 "$ENV_FILE"

echo ""
echo "✅ Configuración guardada en $ENV_FILE"
echo ""
echo "📋 Próximo paso:"
echo "  sudo bash deploy/start-daiscom.sh"