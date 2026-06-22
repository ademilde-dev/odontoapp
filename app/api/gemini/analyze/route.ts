import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Dynamic evaluation: initialize only inside the handler or dynamically to avoid build-time errors if the key is missing or not yet set.
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "A chave API do Gemini (GEMINI_API_KEY) não está configurada nos Secrets." },
        { status: 500 }
      );
    }

    const { prompt, patientData, odontogramData } = await req.json();

    const ai = new GoogleGenAI({ apiKey });

    // Format clinical system instructions
    const systemInstruction = `
      Você é o Co-piloto Clínico de Odontologia, um assistente inteligente integrado ao painel OdontoApp.
      Seu objetivo é auxiliar os dentistas com diagnósticos hipotéticos, explicações de procedimentos em linguagem clara ou clínica, resumos de planos de tratamento e sugestões preventivas com base no histórico do paciente e odontogramas apresentados.
      
      Regras importantes:
      1. Suas respostas devem ser profissionais, éticas, bem estruturadas (em markdown), empáticas e em Português do Brasil.
      2. Lembre sempre o profissional que as sugestões de tratamentos geradas por IA devem ser sempre confirmadas pelo cirurgião-dentista com base no exame clínico presencial e exames radiográficos.
      3. Analise as informações fornecidas sobre dentes e estados deles (se presentes no odontograma).
    `;

    // Combine parameters to build a rich clinical context
    let formattedPrompt = `Solicitação do Dentista: ${prompt}\n\n`;

    if (patientData) {
      formattedPrompt += `### Informações do Paciente:\n`;
      formattedPrompt += `- Nome: ${patientData.name}\n`;
      if (patientData.birthDate) formattedPrompt += `- Data de Nascimento: ${patientData.birthDate}\n`;
      if (patientData.allergies) formattedPrompt += `- Alergias/Problemas Sistêmicos: ${patientData.allergies}\n`;
      if (patientData.notes) formattedPrompt += `- Notas Clínicas: ${patientData.notes}\n`;
      formattedPrompt += `\n`;
    }

    if (odontogramData && Object.keys(odontogramData).length > 0) {
      formattedPrompt += `### Odontograma Ativo (Dentes Registrados):\n`;
      for (const [toothNum, condition] of Object.entries(odontogramData)) {
        formattedPrompt += `- Dente ${toothNum}: ${(condition as any).status || condition} de forma ${(condition as any).faces?.join(", ") || ""}\n`;
      }
      formattedPrompt += `\n`;
    }

    formattedPrompt += `Por favor, forneça uma análise clínica ou resposta estruturada com base nas informações acima.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedPrompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Erro na API do Gemini:", error);
    return NextResponse.json(
      { error: error?.message || "Ocorreu um erro interno ao processar a requisição de IA." },
      { status: 500 }
    );
  }
}
