-- Schema para sistema IoT con Raspberry Pi
-- Base de datos: iot_sensors

-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE; -- Para series temporales (opcional)

-- Tabla para dispositivos Raspberry Pi
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) UNIQUE NOT NULL,
    device_name VARCHAR(100),
    device_type VARCHAR(50) DEFAULT 'raspberry_pi',
    location VARCHAR(100),
    ip_address INET,
    mac_address VARCHAR(17),
    firmware_version VARCHAR(20),
    last_seen TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'offline',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para sensores físicos conectados a cada Raspberry Pi
CREATE TABLE IF NOT EXISTS sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    sensor_type VARCHAR(50) NOT NULL, -- 'temperature', 'humidity', 'pressure', 'light', etc.
    sensor_model VARCHAR(100),
    pin_number INTEGER,
    calibration_offset DECIMAL(10,4) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla principal para datos de sensores
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    sensor_id UUID REFERENCES sensors(id) ON DELETE CASCADE,
    reading_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20),
    quality_score INTEGER DEFAULT 100, -- 0-100 calidad del dato
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB
);

-- Tabla para comandos enviados a Raspberry Pi
CREATE TABLE IF NOT EXISTS device_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    command_type VARCHAR(50) NOT NULL,
    command_payload JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, executed, failed
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP WITH TIME ZONE,
    response JSONB,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Tabla para eventos del sistema
CREATE TABLE IF NOT EXISTS system_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'connection', 'disconnection', 'error', 'alert'
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    message TEXT,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para alertas y notificaciones
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    threshold_min DECIMAL(10,4),
    threshold_max DECIMAL(10,4),
    current_value DECIMAL(10,4),
    severity VARCHAR(20) DEFAULT 'warning',
    is_active BOOLEAN DEFAULT true,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_timestamp ON sensor_readings(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_type_timestamp ON sensor_readings(reading_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_system_events_timestamp ON system_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active, severity);

-- Función para actualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en devices
CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Datos de ejemplo para desarrollo
INSERT INTO devices (device_id, device_name, device_type, location, status) VALUES
    ('RPI001', 'Raspberry Pi Laboratorio A', 'raspberry_pi_4', 'Laboratory_A', 'online'),
    ('RPI002', 'Raspberry Pi Oficina Principal', 'raspberry_pi_4', 'Main_Office', 'online'),
    ('RPI003', 'Raspberry Pi Almacén', 'raspberry_pi_zero', 'Warehouse', 'offline')
ON CONFLICT (device_id) DO NOTHING;

-- Sensores de ejemplo
INSERT INTO sensors (device_id, sensor_type, sensor_model, pin_number) 
SELECT 
    d.id,
    sensor_info.sensor_type,
    sensor_info.sensor_model,
    sensor_info.pin_number
FROM devices d
CROSS JOIN (
    VALUES 
        ('temperature', 'DHT22', 4),
        ('humidity', 'DHT22', 4),
        ('pressure', 'BMP280', NULL),
        ('light', 'LDR', 2)
) AS sensor_info(sensor_type, sensor_model, pin_number)
WHERE d.device_id IN ('RPI001', 'RPI002', 'RPI003');

-- Vista para datos recientes de sensores
CREATE OR REPLACE VIEW latest_sensor_readings AS
SELECT 
    d.device_id,
    d.device_name,
    d.location,
    d.status as device_status,
    sr.reading_type,
    sr.value,
    sr.unit,
    sr.timestamp,
    sr.quality_score
FROM sensor_readings sr
JOIN devices d ON sr.device_id = d.id
JOIN (
    SELECT device_id, reading_type, MAX(timestamp) as max_timestamp
    FROM sensor_readings
    GROUP BY device_id, reading_type
) latest ON sr.device_id = latest.device_id 
    AND sr.reading_type = latest.reading_type 
    AND sr.timestamp = latest.max_timestamp;

-- Vista para resumen de dispositivos
CREATE OR REPLACE VIEW device_summary AS
SELECT 
    d.device_id,
    d.device_name,
    d.location,
    d.status,
    d.last_seen,
    COUNT(s.id) as sensor_count,
    COUNT(sr.id) as total_readings,
    MAX(sr.timestamp) as last_reading
FROM devices d
LEFT JOIN sensors s ON d.id = s.device_id AND s.is_active = true
LEFT JOIN sensor_readings sr ON d.id = sr.device_id
GROUP BY d.id, d.device_id, d.device_name, d.location, d.status, d.last_seen;