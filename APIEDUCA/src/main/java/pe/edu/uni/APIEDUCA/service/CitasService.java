package pe.edu.uni.APIEDUCA.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.uni.APIEDUCA.dto.CitasDto;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class CitasService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public boolean verificarDisponibilidadMedico(long medicoId, String fechaHora) {

        // Validación de entrada
        if (medicoId <= 0) {
            throw new IllegalArgumentException("El ID del médico debe ser mayor a 0");
        }

        if (fechaHora == null || fechaHora.trim().isEmpty()) {
            throw new IllegalArgumentException("La fecha y hora son obligatorias");
        }

        // Sentencia para verificar si el médico tiene cita en ese horario
        String sql = """
            SELECT COUNT(1) cont 
            FROM citas 
            WHERE medico_id = ? 
            AND fecha_hora = ? 
            AND estado IN ('PROGRAMADA', 'CONFIRMADA')
            """;

        try {
            // Proceso
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, medicoId, fechaHora);

            // Reporte - true si está disponible (count = 0)
            return count != null && count == 0;

        } catch (DataAccessException e) {
            throw new RuntimeException("Error al verificar disponibilidad del médico", e);

        } catch (Exception e) {
            throw new RuntimeException("Error interno del sistema", e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public CitasDto programarCita(CitasDto dto) {

        // Variables
        String sql;

        // Validaciones
        validarDatosCita(dto);
        validarPaciente(dto.getPacienteId());
        validarMedico(dto.getMedicoId());
        validarUsuarioCreador(dto.getCreadaPor());
        validarFechaHora(dto.getFechaHora());
        validarHorarioLaboral(dto.getMedicoId(), dto.getFechaHora());

        // Proceso - Obtener duración por defecto si no se especifica
        if (dto.getDuracionMinutos() <= 0) {
            sql = """
                SELECT e.duracion_consulta_minutos 
                FROM usuarios u 
                INNER JOIN especialidades e ON u.especialidad_id = e.id 
                WHERE u.id = ?
                """;
            int duracionDefault = jdbcTemplate.queryForObject(sql, Integer.class, dto.getMedicoId());
            dto.setDuracionMinutos(duracionDefault);
        }

        // Insertar nueva cita
        sql = """
            INSERT INTO citas(paciente_id, medico_id, fecha_hora, duracion_minutos, 
                             estado, motivo_consulta, observaciones_cita, creada_por, 
                             fecha_creacion, fecha_actualizacion)
            VALUES(?, ?, ?, ?, 'PROGRAMADA', ?, ?, ?, GETDATE(), GETDATE())
            """;

        Object[] datos = {
                dto.getPacienteId(), dto.getMedicoId(), dto.getFechaHora(),
                dto.getDuracionMinutos(), dto.getMotivoConsulta(),
                dto.getObservacionesCita(), dto.getCreadaPor()
        };

        jdbcTemplate.update(sql, datos);

        // Reporte
        return dto;
    }

    private void validarDatosCita(CitasDto dto) {
        if (dto == null) {
            throw new RuntimeException("ERROR: Los datos de la cita son obligatorios.");
        }

        if (dto.getPacienteId() <= 0) {
            throw new RuntimeException("ERROR: ID de paciente inválido.");
        }

        if (dto.getMedicoId() <= 0) {
            throw new RuntimeException("ERROR: ID de médico inválido.");
        }

        if (dto.getCreadaPor() <= 0) {
            throw new RuntimeException("ERROR: Usuario creador inválido.");
        }
    }

    private void validarPaciente(long pacienteId) {
        String sql = """
            SELECT COUNT(1) cont FROM pacientes 
            WHERE id = ? AND activo = 1
            """;

        int cont = jdbcTemplate.queryForObject(sql, Integer.class, pacienteId);
        if (cont == 0) {
            throw new RuntimeException("ERROR: Paciente no existe o está inactivo.");
        }
    }

    private void validarMedico(long medicoId) {
        String sql = """
            SELECT COUNT(1) cont FROM usuarios 
            WHERE id = ? AND rol = 'MEDICO' AND activo = 1
            """;

        int cont = jdbcTemplate.queryForObject(sql, Integer.class, medicoId);
        if (cont == 0) {
            throw new RuntimeException("ERROR: Médico no existe o está inactivo.");
        }
    }

    private void validarUsuarioCreador(long usuarioId) {
        String sql = """
            SELECT COUNT(1) cont FROM usuarios 
            WHERE id = ? AND rol IN ('RECEPCIONISTA', 'MEDICO') AND activo = 1
            """;

        int cont = jdbcTemplate.queryForObject(sql, Integer.class, usuarioId);
        if (cont == 0) {
            throw new RuntimeException("ERROR: Usuario creador no válido.");
        }
    }

    private void validarFechaHora(String fechaHora) {
        try {
            LocalDateTime fechaTime = LocalDateTime.parse(fechaHora, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));

            // No permitir citas en el pasado
            if (fechaTime.isBefore(LocalDateTime.now())) {
                throw new RuntimeException("ERROR: No se pueden programar citas en fechas pasadas.");
            }

            // Validar que sea en horario de atención (7:00 - 19:00)
            int hora = fechaTime.getHour();
            if (hora < 7 || hora >= 19) {
                throw new RuntimeException("ERROR: Horario fuera del rango de atención de la clínica (7:00 - 19:00).");
            }

        } catch (Exception e) {
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("ERROR: Formato de fecha y hora inválido. Use: yyyy-MM-dd HH:mm");
        }
    }

    private void validarHorarioLaboral(long medicoId, String fechaHora) {
        try {
            // Parse de fecha para obtener el día de la semana y hora
            LocalDateTime fechaTime = LocalDateTime.parse(fechaHora, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            String diaSemana = fechaTime.getDayOfWeek().name(); // MONDAY, TUESDAY, etc.

            // Mapear días en inglés a español
            Map<String, String> diasMap = new HashMap<>();
            diasMap.put("MONDAY", "LUNES");
            diasMap.put("TUESDAY", "MARTES");
            diasMap.put("WEDNESDAY", "MIERCOLES");
            diasMap.put("THURSDAY", "JUEVES");
            diasMap.put("FRIDAY", "VIERNES");
            diasMap.put("SATURDAY", "SABADO");
            diasMap.put("SUNDAY", "DOMINGO");

            String diaEspanol = diasMap.get(diaSemana);
            String horaConsulta = fechaTime.format(DateTimeFormatter.ofPattern("HH:mm:ss"));

            // Sentencia para verificar horario laboral
            String sql = """
                SELECT COUNT(1) cont FROM horarios_medicos 
                WHERE medico_id = ? AND dia_semana = ? AND activo = 1
                AND ? BETWEEN hora_inicio AND hora_fin
                """;

            int cont = jdbcTemplate.queryForObject(sql, Integer.class, medicoId, diaEspanol, horaConsulta);

            if (cont == 0) {
                throw new RuntimeException("ERROR: El horario solicitado está fuera del horario laboral del médico.");
            }

        } catch (EmptyResultDataAccessException e) {
            throw new RuntimeException("ERROR: El médico no trabaja ese día de la semana.", e);

        } catch (Exception e) {
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("ERROR: Error al verificar horario laboral: " + e.getMessage(), e);
        }
    }
}
