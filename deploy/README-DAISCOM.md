# Instalación ProMail para Daiscom
## Estructura: /home/daiscom/correopro.daiscom.com/

Esta guía específica te ayudará a instalar ProMail en tu VPS usando la estructura estándar de daiscom con integración a GitHub para actualizaciones automáticas.

## Estructura que se creará

```
/home/daiscom/
├── correopro.daiscom.com/
│   ├── public_html/          # Archivos web (frontend construido)
│   ├── backend/              # Código del backend
│   ├── src/                  # Código fuente del frontend
│   ├── logs/                 # Logs del dominio
│   ├── config/               # Configuración
│   ├── backups/              # Backups
│   ├── package.json          # Dependencias
│   └── ecosystem.config.js   # Configuración PM2
├── logs/                     # Logs generales
├── backups/                  # Backups generales
├── manage-promail.sh         # Script de gestión
└── auto-update.sh           # Script de actualización automática
```

## Instalación Completa

### 1. Conectar al VPS como root

```bash
ssh root@tu-vps-ip
```

### 2. Subir los scripts de instalación

Sube la carpeta `deploy/` a tu VPS:

```bash
# Desde tu computadora
scp -r deploy/ root@tu-vps-ip:/root/
```

### 3. Ejecutar instalación paso a paso

```bash
# 1. Configurar estructura base
sudo bash deploy/setup-daiscom.sh

# 2. Clonar repositorio desde GitHub
sudo bash deploy/clone-github.sh
# Te pedirá la URL de tu repositorio GitHub

# 3. Configurar Nginx y SSL
sudo bash deploy/configure-daiscom.sh

# 4. Configurar credenciales IMAP/SMTP
sudo bash deploy/setup-credentials.sh
# Te pedirá las credenciales del servidor de correo

# 5. Iniciar servicios
sudo bash deploy/start-daiscom.sh
```

## Configuración de Credenciales

Durante el paso 4, se te pedirán estas credenciales:

```
Host IMAP: host-srv-901.daiscom.com.co
Puerto IMAP: 143
Usuario IMAP: tu-email@daiscom.com.co
Contraseña IMAP: [tu contraseña]

Host SMTP: host-srv-901.daiscom.com.co
Puerto SMTP: 25
Usuario SMTP: tu-email@daiscom.com.co
Contraseña SMTP: [tu contraseña]
```

## Gestión del Servicio

### Comandos principales

```bash
# Ver estado
sudo -u daiscom ~/manage-promail.sh status

# Ver logs en tiempo real
sudo -u daiscom ~/manage-promail.sh logs

# Reiniciar servicio
sudo -u daiscom ~/manage-promail.sh restart

# Actualizar desde GitHub
sudo -u daiscom ~/manage-promail.sh update

# Crear backup
sudo -u daiscom ~/manage-promail.sh backup
```

### Gestión directa con PM2

```bash
# Como usuario daiscom
sudo -u daiscom pm2 status
sudo -u daiscom pm2 logs promail-daiscom
sudo -u daiscom pm2 restart promail-daiscom
sudo -u daiscom pm2 stop promail-daiscom
sudo -u daiscom pm2 start promail-daiscom
```

## Actualizaciones desde GitHub

### Actualización manual

```bash
sudo -u daiscom ~/manage-promail.sh update
```

Este comando:
1. Hace `git pull` del repositorio
2. Instala nuevas dependencias si las hay
3. Construye el frontend
4. Copia archivos a `public_html/`
5. Reinicia el backend

### Actualización automática

Para configurar actualizaciones automáticas cada 6 horas:

```bash
# Editar crontab del usuario daiscom
sudo -u daiscom crontab -e

# Agregar esta línea:
0 */6 * * * /home/daiscom/auto-update.sh
```

El script `auto-update.sh` verifica si hay cambios en GitHub y actualiza automáticamente si los encuentra.

## Monitoreo y Logs

### Logs del sistema

```bash
# Logs de Nginx
tail -f /home/daiscom/correopro.daiscom.com/logs/access.log
tail -f /home/daiscom/correopro.daiscom.com/logs/error.log

# Logs de PM2
tail -f /home/daiscom/correopro.daiscom.com/logs/pm2-out.log
tail -f /home/daiscom/correopro.daiscom.com/logs/pm2-error.log

# Logs de ProMail
tail -f /home/daiscom/correopro.daiscom.com/logs/promail.log

# Logs de actualizaciones automáticas
tail -f /home/daiscom/logs/auto-update.log
```

### Estado de servicios

```bash
# Estado de PM2
sudo -u daiscom pm2 status

# Estado de Nginx
sudo systemctl status nginx

# Estado de SSL
sudo certbot certificates
```

## Backups

### Backup manual

```bash
# Crear backup completo
sudo -u daiscom ~/manage-promail.sh backup

# Backup solo de configuración
sudo tar -czf /home/daiscom/backups/config-$(date +%Y%m%d).tar.gz \
  /home/daiscom/correopro.daiscom.com/backend/.env \
  /home/daiscom/correopro.daiscom.com/config/
```

### Backup automático

```bash
# Editar crontab para backup diario a las 2 AM
sudo -u daiscom crontab -e

# Agregar:
0 2 * * * /home/daiscom/manage-promail.sh backup
```

## Desarrollo y Testing

### Probar cambios localmente

```bash
# En tu computadora local
npm run dev  # Frontend en http://localhost:5173
cd backend && npm run dev  # Backend en http://localhost:3001
```

### Subir cambios

```bash
# Hacer commit y push a GitHub
git add .
git commit -m "Descripción de cambios"
git push origin main

# En el servidor, actualizar
sudo -u daiscom ~/manage-promail.sh update
```

## Solución de Problemas

### El sitio no carga

```bash
# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx

# Verificar archivos web
ls -la /home/daiscom/correopro.daiscom.com/public_html/
```

### Backend no responde

```bash
# Ver logs detallados
sudo -u daiscom pm2 logs promail-daiscom --lines 100

# Verificar configuración
cat /home/daiscom/correopro.daiscom.com/backend/.env

# Reiniciar backend
sudo -u daiscom pm2 restart promail-daiscom
```

### Problemas de actualización

```bash
# Ver logs de actualización
cat /home/daiscom/logs/auto-update.log

# Actualización manual con debug
cd /home/daiscom/correopro.daiscom.com/
sudo -u daiscom git status
sudo -u daiscom git pull origin main
```

### Problemas de permisos

```bash
# Corregir permisos
sudo chown -R daiscom:daiscom /home/daiscom/correopro.daiscom.com/
sudo chmod 600 /home/daiscom/correopro.daiscom.com/backend/.env
```

## URLs y Accesos

- **Sitio web**: https://correopro.daiscom.com
- **API**: https://correopro.daiscom.com/api/
- **Logs Nginx**: `/home/daiscom/correopro.daiscom.com/logs/`
- **Configuración**: `/home/daiscom/correopro.daiscom.com/config/`
- **SSL**: `/etc/letsencrypt/live/correopro.daiscom.com/`

## Ventajas de esta configuración

✅ **Estructura estándar**: Compatible con hosting tradicional  
✅ **Actualizaciones automáticas**: Desde GitHub  
✅ **Backups automáticos**: Programados  
✅ **Logs centralizados**: Fácil debugging  
✅ **SSL automático**: Con renovación  
✅ **Gestión simplificada**: Scripts de administración  
✅ **Escalable**: Fácil agregar más dominios  

Esta configuración es perfecta para un entorno de producción profesional con mantenimiento mínimo.