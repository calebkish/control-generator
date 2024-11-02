import { ControlSchemaV1 } from '../../../../desktop/src/http-server/models';
import { glossary } from './glossary';

const descriptionAssistRole = `Role:
You are an expert CPA specifically designed to assist in writing internal controls that address the control objective specified. Your objective is to ensure the background information for a control contains enough detailed information so that an uninformed user can read that information and write design attributes from it.`;

const descriptionAssistTask = `Task:
Write bullet point questions to critique the control description provided until the description is sufficient enough to write control design attributes. Think step by step for all procedures performed to determine if information is missing to write a complete, concise, and accurate control attribute. Keep each question to a single sentence and business professional. Write only the questions and nothing more. Once you believe the description is sufficient, reply with, "No further recommendations. Please proceed to control design step." Take pride in your work and do your best to adhere exactly to these instructions. The company's bottom line depends on it.`;

export const descriptionAssistSystemPrompt = `${descriptionAssistRole}

${glossary}

${descriptionAssistTask}`;

export function getDescriptionAssistUserPrompt(
  f: ControlSchemaV1['value']['form'],
  userInput: string
) {
  const errorMessage = validateFormForDescription(f);
  if (errorMessage) {
    return { success: false, message: errorMessage };
  }

  const userPrompt = `What are some bullet point questions to critique the Control Description below, using the Control Form as context? Once you believe the description is sufficient, reply with, "No further recommendations. Please proceed to control design step."

Control Form:
Name: ${f.name}
General Process Category: ${f.generalProcessCategory}
Objective: ${f.objective}
Control type: ${f.type}
${f.type === 'itdm' && !!f.ipc ? `IPC: ${f.ipc}` : ''}
Frequency: ${f.frequency}
${!!f.judgement ? `Judgement/complexity: ${f.judgement}` : ''}
${!!f.quantitativeThesholds ? `Quantitative Thresholds: ${f.quantitativeThesholds}` : ''}
${!!f.qualitativeThresholds ? `Qualitative Thresholds: ${f.qualitativeThresholds}` : ''}
${!!f.investigationProcess ? `Investigation and resolution procedures: ${f.investigationProcess}` : ''}

Control Description:
${userInput}`;

  return {
    success: true,
    message: userPrompt,
  };
};

/**
 * Determines whether a user can proceed to the "Description Assistant" page.
 * @return {string[]} where each string is an invalid field.
 * @returns {null} if all fields are valid.
 */
export function validateFormForDescription(
  f: ControlSchemaV1['value']['form']
) {
  const invalidFields: string[] = [];

  if (!f.generalProcessCategory) {
    invalidFields.push('General Process Category');
  }
  if (!f.objective) {
    invalidFields.push('Objective');
  }
  if (!f.type) {
    invalidFields.push('Control Type');
  }
  if (!f.frequency) {
    invalidFields.push('Frequency');
  }

  if (invalidFields.length > 0) {
    return `Needed fields: ${invalidFields.join(', ')}`;
  }

  return null;
}
