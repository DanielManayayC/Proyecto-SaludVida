
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully,
  // but for this example, we'll throw an error if the key is missing.
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Suggests a medical specialty based on a reason for visit.
 * @param reason The patient's reason for the visit.
 * @param specialties A list of available specialties.
 * @returns The suggested specialty as a string.
 */
export const suggestSpecialty = async (reason: string, specialties: string[]): Promise<string> => {
  const model = "gemini-2.5-flash-preview-04-17";
  
  const prompt = `Basado en el siguiente motivo de consulta: "${reason}", ¿cuál de las siguientes especialidades médicas es la más apropiada? Especialidades disponibles: ${specialties.join(', ')}. Responde únicamente con el nombre de la especialidad sugerida.`;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });
    
    // The .text property directly gives the string output.
    const text = response.text.trim();

    // Clean up potential markdown or extra text, just in case.
    return text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim();

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "No se pudo obtener una sugerencia.";
  }
};
