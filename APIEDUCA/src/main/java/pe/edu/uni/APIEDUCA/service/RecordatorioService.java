package pe.edu.uni.APIEDUCA.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.uni.APIEDUCA.dto.RecordatorioDto;

import java.util.List;
import java.util.Map;

@Service
public class RecordatorioService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<RecordatorioDto> obtenerRecordatoriosPendientes() {

        // Validación básica
        String sql = """
            SELECT 
                r.id,
                r.cita_id,
                c.paciente_id,
                CONCAT(p.nombre, ' ', p.apellido) as nombre_paciente,
                p.telefono,
                p.email,
                CONCAT(u.nombre, ' ', u.apellido) as nombre_medico,
                FORMAT(c.fecha_hora, 'dd/MM/yyyy HH:mm') as fecha_hora,
                r.tipo,
                r.mensaje,
                r.estado,
                r.intentos
            FROM recordatorios r
            INNER JOIN citas c ON r.cita_id = c.id
            INNER JOIN pacientes p ON c.paciente_id = p.id
            INNER JOIN usuarios u ON c.medico_id = u.id
            WHERE r.estado = 'PENDIENTE' 
            AND r.fecha_envio_programada <= GETDATE()
            AND c.estado IN ('PROGRAMADA', 'CONFIRMADA')
            ORDER BY r.fecha_envio_programada ASC
            """;

        try {
            return jdbcTemplate.query(sql, (rs, rowNum) ->
                    RecordatorioDto.builder()
                            .idRecordatorio(rs.getLong("id"))
                            .idCita(rs.getLong("cita_id"))
                            .idPaciente(rs.getLong("paciente_id"))
                            .nombrePaciente(rs.getString("nombre_paciente"))
                            .telefonoPaciente(rs.getString("telefono"))
                            .emailPaciente(rs.getString("email"))
                            .nombreMedico(rs.getString("nombre_medico"))
                            .fechaHora(rs.getString("fecha_hora"))
                            .tipo(rs.getString("tipo"))
                            .mensaje(rs.getString("mensaje"))
                            .estado(rs.getString("estado"))
                            .intentos(rs.getInt("intentos"))
                            .build()
            );

        } catch (DataAccessException e) {
            throw new RuntimeException("Error al obtener recordatorios pendientes", e);
        } catch (Exception e) {
            throw new RuntimeException("Error interno del sistema", e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public RecordatorioDto procesarEnvioRecordatorio(long idRecordatorio) {

        // Variables
        String sql;

        // Validaciones
        validarRecordatorioExiste(idRecordatorio);
        validarRecordatorioEstadoPendiente(idRecordatorio);
        validarIntentosMaximos(idRecordatorio);

        // Obtener datos del recordatorio
        sql = """
            SELECT 
                r.id, r.cita_id, r.tipo, r.mensaje, r.intentos,
                CONCAT(p.nombre, ' ', p.apellido) as nombre_paciente,
                p.telefono, p.email,
                CONCAT(u.nombre, ' ', u.apellido) as nombre_medico,
                FORMAT(c.fecha_hora, 'dd/MM/yyyy HH:mm') as fecha_hora
            FROM recordatorios r
            INNER JOIN citas c ON r.cita_id = c.id
            INNER JOIN pacientes p ON c.paciente_id = p.id
            INNER JOIN usuarios u ON c.medico_id = u.id
            WHERE r.id = ?
            """;

        Map<String, Object> datos = jdbcTemplate.queryForMap(sql, idRecordatorio);

        String tipo = datos.get("tipo").toString();
        String nombrePaciente = datos.get("nombre_paciente").toString();
        String fechaHora = datos.get("fecha_hora").toString();
        String nombreMedico = datos.get("nombre_medico").toString();
        String telefono = datos.get("telefono") != null ? datos.get("telefono").toString() : "";
        String email = datos.get("email") != null ? datos.get("email").toString() : "";
        int intentos = Integer.parseInt(datos.get("intentos").toString());

        // Proceso de envío
        boolean envioExitoso = false;
        String errorMensaje = null;

        try {
            if ("EMAIL".equals(tipo)) {
                validarEmail(email);
                envioExitoso = enviarEmail(email, nombrePaciente, fechaHora, nombreMedico);
            } else if ("SMS".equals(tipo)) {
                validarTelefono(telefono);
                envioExitoso = enviarSMS(telefono, nombrePaciente, fechaHora, nombreMedico);
            }
        } catch (Exception e) {
            errorMensaje = e.getMessage();
        }

        // Actualizar estado del recordatorio
        intentos++;
        String nuevoEstado = envioExitoso ? "ENVIADO" : "FALLIDO";

        sql = """
            UPDATE recordatorios 
            SET estado = ?, 
                intentos = ?, 
                fecha_envio_real = CASE WHEN ? = 'ENVIADO' THEN GETDATE() ELSE fecha_envio_real END,
                error_mensaje = ?
            WHERE id = ?
            """;

        jdbcTemplate.update(sql, nuevoEstado, intentos, nuevoEstado, errorMensaje, idRecordatorio);

        // Reporte
        return RecordatorioDto.builder()
                .idRecordatorio(idRecordatorio)
                .idCita(Long.parseLong(datos.get("cita_id").toString()))
                .nombrePaciente(nombrePaciente)
                .telefonoPaciente(telefono)
                .emailPaciente(email)
                .nombreMedico(nombreMedico)
                .fechaHora(fechaHora)
                .tipo(tipo)
                .estado(nuevoEstado)
                .intentos(intentos)
                .build();
    }

    private void validarRecordatorioExiste(long idRecordatorio) {
        String sql = "SELECT COUNT(1) cont FROM recordatorios WHERE id = ?";
        int cont = jdbcTemplate.queryForObject(sql, Integer.class, idRecordatorio);
        if (cont == 0) {
            throw new RuntimeException("ERROR: Recordatorio no existe.");
        }
    }

    private void validarRecordatorioEstadoPendiente(long idRecordatorio) {
        String sql = "SELECT COUNT(1) cont FROM recordatorios WHERE id = ? AND estado = 'PENDIENTE'";
        int cont = jdbcTemplate.queryForObject(sql, Integer.class, idRecordatorio);
        if (cont == 0) {
            throw new RuntimeException("ERROR: Recordatorio no está pendiente.");
        }
    }

    private void validarIntentosMaximos(long idRecordatorio) {
        String sql = "SELECT intentos FROM recordatorios WHERE id = ?";
        int intentos = jdbcTemplate.queryForObject(sql, Integer.class, idRecordatorio);
        if (intentos >= 3) {
            throw new RuntimeException("ERROR: Máximo número de intentos alcanzado.");
        }
    }

    private void validarEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("ERROR: Email del paciente no válido.");
        }
        if (!email.contains("@")) {
            throw new RuntimeException("ERROR: Formato de email incorrecto.");
        }
    }

    private void validarTelefono(String telefono) {
        if (telefono == null || telefono.trim().isEmpty()) {
            throw new RuntimeException("ERROR: Teléfono del paciente no válido.");
        }
    }

    private boolean enviarEmail(String email, String nombrePaciente, String fechaHora, String nombreMedico) {
        // Simulación de envío de email
        // En implementación real se integraría con servicio de email (ej: SendGrid, AWS SES)
        try {
            String mensaje = String.format(
                    "Estimado/a %s,\n\nLe recordamos su cita médica programada para el %s con %s.\n\nClínica Salud y Vida",
                    nombrePaciente, fechaHora, nombreMedico
            );

            // Simulación de delay de envío
            Thread.sleep(100);

            // Simulación de éxito (90% de probabilidad)
            return Math.random() > 0.1;

        } catch (Exception e) {
            throw new RuntimeException("Error al enviar email: " + e.getMessage());
        }
    }

    private boolean enviarSMS(String telefono, String nombrePaciente, String fechaHora, String nombreMedico) {
        // Simulación de envío de SMS
        // En implementación real se integraría con servicio de SMS (ej: Twilio, AWS SNS)
        try {
            String mensaje = String.format(
                    "Hola %s, recordatorio: cita médica %s con %s. Clínica Salud y Vida",
                    nombrePaciente, fechaHora, nombreMedico
            );

            // Simulación de delay de envío
            Thread.sleep(200);

            // Simulación de éxito (85% de probabilidad)
            return Math.random() > 0.15;

        } catch (Exception e) {
            throw new RuntimeException("Error al enviar SMS: " + e.getMessage());
        }
    }
}
