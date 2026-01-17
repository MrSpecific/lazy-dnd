'use client';
import React, { useState, useEffect, useId } from 'react';
import { TextArea, Box, Flex, IconButton, Tooltip } from '@radix-ui/themes';
import {
  CodeIcon,
  FontBoldIcon,
  FontItalicIcon,
  Link1Icon,
  QuestionMarkCircledIcon,
} from '@radix-ui/react-icons';
import { InputLabel } from './InputLabel';

type MarkdownInputProps = {
  name: string;
  label?: string;
  id?: string;
  value?: string;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  tooltip?: string | null;
  required?: boolean;
};

export const MarkdownInput: React.FC<MarkdownInputProps> = ({
  name,
  label,
  id,
  value,
  defaultValue,
  onValueChange = () => {},
  tooltip,
  required = false,
}) => {
  const reactId = useId();
  const inputId = id || reactId;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(() => value ?? defaultValue ?? '');

  useEffect(() => {
    if (isControlled) return;
    if (defaultValue !== undefined) {
      setInternalValue(defaultValue ?? '');
    }
  }, [defaultValue, isControlled]);

  const currentValue = isControlled ? value ?? '' : internalValue;

  const updateValue = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange(nextValue);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateValue(event.target.value);
  };

  const applyMarkdownSyntax = (syntax: string) => {
    const textarea = document.getElementById(inputId) as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? start;
    if (start === end) return;
    const selectedText = textarea.value.substring(start, end);

    const formattedText =
      syntax === 'link' ? `[${selectedText}](url)` : `${syntax}${selectedText}${syntax}`;
    const updatedText =
      textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    updateValue(updatedText);

    const selectionEnd = end + (formattedText.length - selectedText.length);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, selectionEnd);
    });
  };

  return (
    <Box>
      <Flex gap="1" justify="between">
        <InputLabel htmlFor={inputId} label={label || name} required={required}>
          {tooltip && (
            <Tooltip content={tooltip}>
              <QuestionMarkCircledIcon />
            </Tooltip>
          )}
        </InputLabel>
        <Flex gap="1" justify="end" mb="1">
          <IconButton
            type="button"
            onClick={() => applyMarkdownSyntax('`')}
            size="1"
            color="gray"
            variant="soft"
          >
            <CodeIcon />
          </IconButton>
          <IconButton
            type="button"
            onClick={() => applyMarkdownSyntax('**')}
            size="1"
            color="gray"
            variant="soft"
          >
            <FontBoldIcon />
          </IconButton>
          <IconButton
            type="button"
            onClick={() => applyMarkdownSyntax('*')}
            size="1"
            color="gray"
            variant="soft"
          >
            <FontItalicIcon />
          </IconButton>
          <IconButton
            type="button"
            onClick={() => applyMarkdownSyntax('link')}
            size="1"
            color="gray"
            variant="soft"
          >
            <Link1Icon />
          </IconButton>
        </Flex>
      </Flex>
      <TextArea
        name={name}
        id={inputId}
        value={currentValue}
        onChange={handleInputChange}
        style={{
          minHeight: '6em',
        }}
        resize="vertical"
        mb="2"
      />
    </Box>
  );
};

export default MarkdownInput;
