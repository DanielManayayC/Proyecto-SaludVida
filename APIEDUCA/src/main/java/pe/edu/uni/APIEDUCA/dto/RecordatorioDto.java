package pe.edu.uni.APIEDUCA.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Builder
public class RecordatorioDto {

    private long idRecordatorio;
    private long idCita;
    private long idPaciente;
    private String nombrePaciente;
    private String telefonoPaciente;
    private String emailPaciente;
    private String nombreMedico;
    private String fechaHora;
    private String tipo; // EMAIL o SMS
    private String mensaje;
    private String estado; // PENDIENTE, ENVIADO, FALLIDO
    private int intentos;
}