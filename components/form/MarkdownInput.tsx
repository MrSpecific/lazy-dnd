'use client';
import React, { useState, useEffect, useId } from 'react';
import { TextArea, Box, Flex, IconButton, Tooltip } from '@radix-ui/themes';
import {
  CodeIcon,
  FontBoldIcon,
  FontItalicIcon,
  Link1Icon,
  ListBulletIcon,
  QuestionMarkCircledIcon,
} from '@radix-ui/react-icons';
import { ListOrdered } from 'lucide-react';
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

  const getTextarea = () => document.getElementById(inputId) as HTMLTextAreaElement | null;

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateValue(event.target.value);
  };

  const applyMarkdownSyntax = (syntax: string) => {
    const textarea = getTextarea();
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

  const applyListSyntax = (type: 'bullet' | 'ordered') => {
    const textarea = getTextarea();
    if (!textarea) return;
    const value = textarea.value;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? start;
    const blockStart = value.lastIndexOf('\n', start - 1) + 1;
    const blockEndIndex = value.indexOf('\n', end);
    const blockEnd = blockEndIndex === -1 ? value.length : blockEndIndex;
    const block = value.slice(blockStart, blockEnd);
    const lines = block.split('\n');

    let order = 1;
    const formattedLines = lines.map((line) => {
      if (!line.trim()) return line;
      if (type === 'bullet') {
        return /^\s*[-*+]\s+/.test(line) ? line : `- ${line}`;
      }
      if (/^\s*\d+\.\s+/.test(line)) return line;
      return `${order++}. ${line}`;
    });

    const formattedBlock = formattedLines.join('\n');
    const updatedText = value.slice(0, blockStart) + formattedBlock + value.slice(blockEnd);
    updateValue(updatedText);

    requestAnimationFrame(() => {
      textarea.focus();
      if (start === end) {
        const prefixDelta = formattedLines[0].length - lines[0].length;
        const cursor = start + prefixDelta;
        textarea.setSelectionRange(cursor, cursor);
      } else {
        textarea.setSelectionRange(blockStart, blockStart + formattedBlock.length);
      }
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
          <IconButton
            type="button"
            onClick={() => applyListSyntax('bullet')}
            size="1"
            color="gray"
            variant="soft"
          >
            <ListBulletIcon />
          </IconButton>
          <IconButton
            type="button"
            onClick={() => applyListSyntax('ordered')}
            size="1"
            color="gray"
            variant="soft"
          >
            <ListOrdered size={14} />
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
