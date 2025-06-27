package pe.edu.uni.APIEDUCA.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.uni.APIEDUCA.dto.CitasProcesosDto;

@Service
public class CitasProcesosService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public CitasProcesosDto cancelarCita(CitasProcesosDto dto) {
        // Variables
        String sql;

        // Validaciones
        validarCitaExiste(dto.getCitaId());
        validarCitaPuedeCancelarse(dto.getCitaId());
        validarUsuario(dto.getUsuarioId());
        validarMotivo(dto.getMotivo());

        // Proceso de cancelación
        sql = """
            UPDATE citas
            SET estado = 'CANCELADA',
                cancelada_por = ?,
                motivo_cancelacion = ?,
                fecha_cancelacion = GETDATE(),
                fecha_actualizacion = GETDATE()
            WHERE id = ?
            """;

        jdbcTemplate.update(sql, dto.getUsuarioId(), dto.getMotivo(), dto.getCitaId());

        // Cancelar recordatorios asociados
        sql = """
            UPDATE recordatorios
            SET estado = 'FALLIDO'
            WHERE cita_id = ? AND estado = 'PENDIENTE'
            """;

        jdbcTemplate.update(sql, dto.getCitaId());

        // Reporte
        dto.setAccion("CANCELADA");
        return dto;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public CitasProcesosDto reprogramarCita(CitasProcesosDto dto) {
        // Variables
        String sql;

        // Validaciones
        validarCitaExiste(dto.getCitaId());
        validarCitaPuedeReprogramarse(dto.getCitaId());
        validarUsuario(dto.getUsuarioId());
        validarMedico(dto.getMedicoId());
        validarFechaHora(dto.getFechaHora());
        validarDisponibilidadMedico(dto.getMedicoId(), dto.getFechaHora());
        validarHorarioMedico(dto.getMedicoId(), dto.getFechaHora()); // Este método es el corregido

        // Obtener ID de cita original para auditoría (no se usa aquí en el UPDATE, pero se mantiene la línea)
        // long citaOriginalId = dto.getCitaId(); // Esto no se usa directamente en el UPDATE, pero es una buena práctica para auditoría si se necesitara una nueva fila.

        // Proceso de reprogramación
        sql = """
            UPDATE citas
            SET medico_id = ?,
                fecha_hora = ?,
                reprogramada_desde = ?, -- Esto no estaba en el DTO, pero se requiere para la auditoría de la tabla
                fecha_actualizacion = GETDATE()
            WHERE id = ?
            """;
        // Asumiendo que 'reprogramada_desde' se refiere a la misma cita que se está reprogramando,
        // o a una cita anterior si fuera una 'reprogramación de reprogramación'.
        // Para la primera reprogramación, podría ser el mismo ID de la cita actual.
        jdbcTemplate.update(sql, dto.getMedicoId(), dto.getFechaHora(), dto.getCitaId(), dto.getCitaId());


        // Actualizar recordatorios asociados
        sql = """
            UPDATE recordatorios
            SET fecha_envio_programada = DATEADD(hour, -24, CAST(? AS DATETIME2)),
                estado = 'PENDIENTE',
                intentos = 0
            WHERE cita_id = ? AND estado IN ('PENDIENTE', 'FALLIDO')
            """;

        jdbcTemplate.update(sql, dto.getFechaHora(), dto.getCitaId());

        // Reporte
        dto.setAccion("REPROGRAMADA");
        return dto;
    }

    private void validarCitaExiste(long citaId) {
        String sql = "SELECT COUNT(1) cont FROM citas WHERE id = ?";
        int cont = jdbcTemplate.queryForObject(sql, Integer.class, citaId);
        if (cont == 0) {
            throw new RuntimeException("ERROR: Cita no existe.");
        }
    }

    private void validarCitaPuedeCancelarse(long citaId) {
        String sql = "SELECT estado FROM citas WHERE id = ?";
        String estado = jdbcTemplate.queryForObject(sql, String.class, citaId);
        if (!"PROGRAMADA".equals(estado) && !"CONFIRMADA".equals(estado)) {
            throw new RuntimeException("ERROR: La cita no puede cancelarse en su estado actual.");
        }
    }

    private void validarCitaPuedeReprogramarse(long citaId) {
        String sql = "SELECT estado FROM citas WHERE id = ?";
        String estado = jdbcTemplate.queryForObject(sql, String.class, citaId);
        if (!"PROGRAMADA".equals(estado) && !"CONFIRMADA".equals(estado)) {
            throw new RuntimeException("ERROR: La cita no puede reprogramarse en su estado actual.");
        }
    }

    private void validarUsuario(long usuarioId) {
        String sql = "SELECT COUNT(1) cont FROM usuarios WHERE id = ? AND activo = 1";
        int cont = jdbcTemplate.queryForObject(sql, Integer.class, usuarioId);
        if (cont == 0) {
            throw new RuntimeException("ERROR: Usuario no existe o no está activo.");
        }
    }

    private void validarMedico(long medicoId) {
        String sql = "SELECT COUNT(1) cont FROM usuarios WHERE id = ? AND rol = 'MEDICO' AND activo = 1";
        int cont = jdbcTemplate.queryForObject(sql, Integer.class, medicoId);
        if (cont == 0) {
            throw new RuntimeException("ERROR: Médico no existe o no está activo.");
        }
    }

    private void validarFechaHora(String fechaHora) {
        if (fechaHora == null || fechaHora.trim().isEmpty()) {
            throw new RuntimeException("ERROR: Fecha y hora son requeridas.");
        }

        try {
            // Validar que la fecha no sea en el pasado
            // Note: FORMAT(?, 'yyyy-MM-dd HH:mm') podría ser más robusto para el CAST si el formato de entrada varía.
            String sql = "SELECT CASE WHEN CAST(? AS DATETIME2) > GETDATE() THEN 1 ELSE 0 END";
            int valida = jdbcTemplate.queryForObject(sql, Integer.class, fechaHora);
            if (valida == 0) {
                throw new RuntimeException("ERROR: La fecha debe ser futura.");
            }
        } catch (DataAccessException e) {
            // Captura errores de formato de fecha que resultan en DataAccessException
            throw new RuntimeException("ERROR: Formato de fecha u hora inválido o no soportado: " + fechaHora, e);
        }
    }

    private void validarDisponibilidadMedico(long medicoId, String fechaHora) {
        String sql = """
            SELECT COUNT(1) cont
            FROM citas
            WHERE medico_id = ? AND fecha_hora = ? AND estado IN ('PROGRAMADA', 'CONFIRMADA')
            """;
        int cont = jdbcTemplate.queryForObject(sql, Integer.class, medicoId, fechaHora);
        if (cont > 0) {
            throw new RuntimeException("ERROR: El médico no está disponible en esa fecha y hora.");
        }
    }

    // Metodo para manejar el idioma de DATENAME
    private void validarHorarioMedico(long medicoId, String fechaHora) {
        String sql = """
            SET LANGUAGE 'Spanish'; -- Fuerzo el idioma español para esta sesión/consulta
            SELECT COUNT(1) cont
            FROM horarios_medicos hm
            WHERE hm.medico_id = ?
            AND hm.dia_semana = UPPER(DATENAME(WEEKDAY, CAST(? AS DATETIME2)))
            AND CAST(? AS TIME) BETWEEN hm.hora_inicio AND hm.hora_fin
            AND hm.activo = 1
            """;
        try {
            int cont = jdbcTemplate.queryForObject(sql, Integer.class, medicoId, fechaHora, fechaHora);
            if (cont == 0) {
                throw new RuntimeException("ERROR: El médico no tiene horario disponible en esa fecha y hora (verifique día o rango de horas).");
            }
        } catch (DataAccessException e) {
            // Capturar si la conversión de fecha/hora dentro de la consulta falla
            throw new RuntimeException("ERROR SQL en validación de horario: " + e.getMessage() + ". Asegúrese del formato 'YYYY-MM-DD HH:mm'.", e);
        }
    }

    private void validarMotivo(String motivo) {
        if (motivo == null || motivo.trim().isEmpty()) {
            throw new RuntimeException("ERROR: El motivo es requerido.");
        }
        if (motivo.length() > 255) {
            throw new RuntimeException("ERROR: El motivo es demasiado largo.");
        }
    }
}
