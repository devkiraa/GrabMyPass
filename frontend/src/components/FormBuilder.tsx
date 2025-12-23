'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Plus,
    Trash2,
    GripVertical,
    Copy,
    ChevronDown,
    Settings2,
    SeparatorHorizontal,
    Type,
    AlignLeft,
    List,
    CheckSquare,
    Circle,
    Calendar,
    Hash,
    Phone,
    Mail,
    Clock,
    Link as LinkIcon,
    ToggleLeft
} from 'lucide-react';
import { useState } from 'react';

interface FormItem {
    id: string;
    itemType: 'question' | 'section';
    // Question properties
    type?: string;
    label: string;
    description?: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
    // Section properties (for section type)
    sectionDescription?: string;
}

interface FormBuilderProps {
    questions: FormItem[];
    onChange: (questions: FormItem[]) => void;
}

// All field types like Google Forms
const FIELD_TYPES = [
    { value: 'text', label: 'Short answer', icon: Type },
    { value: 'textarea', label: 'Paragraph', icon: AlignLeft },
    { value: 'select', label: 'Dropdown', icon: ChevronDown },
    { value: 'radio', label: 'Multiple choice', icon: Circle },
    { value: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'tel', label: 'Phone number', icon: Phone },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'time', label: 'Time', icon: Clock },
    { value: 'url', label: 'URL/Link', icon: LinkIcon },
];

export function FormBuilder({ questions, onChange }: FormBuilderProps) {
    const [activeItem, setActiveItem] = useState<string | null>(null);

    // Add a new question
    const addQuestion = (type: string = 'text', afterId?: string) => {
        const newQ: FormItem = {
            id: `q-${Date.now()}`,
            itemType: 'question',
            type,
            label: 'Question',
            required: false,
            placeholder: '',
            options: ['radio', 'checkbox', 'select'].includes(type) ? ['Option 1'] : undefined
        };

        if (afterId) {
            const index = questions.findIndex(q => q.id === afterId);
            const newQuestions = [...questions];
            newQuestions.splice(index + 1, 0, newQ);
            onChange(newQuestions);
        } else {
            onChange([...questions, newQ]);
        }
        setActiveItem(newQ.id);
    };

    // Add a new section
    const addSection = (afterId?: string) => {
        const newSection: FormItem = {
            id: `section-${Date.now()}`,
            itemType: 'section',
            label: 'Section Title',
            sectionDescription: 'Section description (optional)'
        };

        if (afterId) {
            const index = questions.findIndex(q => q.id === afterId);
            const newQuestions = [...questions];
            newQuestions.splice(index + 1, 0, newSection);
            onChange(newQuestions);
        } else {
            onChange([...questions, newSection]);
        }
        setActiveItem(newSection.id);
    };

    const updateItem = (id: string, field: keyof FormItem, value: any) => {
        onChange(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const duplicateItem = (id: string) => {
        const index = questions.findIndex(q => q.id === id);
        const item = questions[index];
        const newItem = { ...item, id: `${item.itemType}-${Date.now()}` };
        const newQuestions = [...questions];
        newQuestions.splice(index + 1, 0, newItem);
        onChange(newQuestions);
    };

    const removeItem = (id: string) => {
        onChange(questions.filter(q => q.id !== id));
    };

    const addOption = (qId: string) => {
        onChange(questions.map(q => {
            if (q.id === qId) {
                return { ...q, options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] };
            }
            return q;
        }));
    };

    const updateOption = (qId: string, index: number, value: string) => {
        onChange(questions.map(q => {
            if (q.id === qId) {
                const newOptions = [...(q.options || [])];
                newOptions[index] = value;
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const removeOption = (qId: string, index: number) => {
        onChange(questions.map(q => {
            if (q.id === qId) {
                return { ...q, options: q.options?.filter((_, i) => i !== index) };
            }
            return q;
        }));
    };

    const moveItem = (id: string, direction: 'up' | 'down') => {
        const index = questions.findIndex(q => q.id === id);
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) {
            return;
        }
        const newQuestions = [...questions];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
        onChange(newQuestions);
    };

    const getFieldIcon = (type: string) => {
        const field = FIELD_TYPES.find(f => f.value === type);
        return field?.icon || Type;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Registration Form</h2>
                    <p className="text-sm text-slate-500">
                        {questions.filter(q => q.itemType === 'question').length} questions, {' '}
                        {questions.filter(q => q.itemType === 'section').length} sections
                    </p>
                </div>
            </div>

            {/* Form Items */}
            <div className="space-y-3">
                {questions.map((item, index) => {
                    const isActive = activeItem === item.id;

                    // SECTION CARD
                    if (item.itemType === 'section') {
                        return (
                            <Card
                                key={item.id}
                                className={`border-l-4 border-l-indigo-500 ${isActive ? 'ring-2 ring-indigo-500' : 'border-slate-200'} shadow-sm cursor-pointer transition-all`}
                                onClick={() => setActiveItem(item.id)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 text-slate-400 cursor-move hover:text-slate-600">
                                            <GripVertical className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
                                                <SeparatorHorizontal className="w-4 h-4" />
                                                Section
                                            </div>
                                            <Input
                                                value={item.label}
                                                onChange={(e) => updateItem(item.id, 'label', e.target.value)}
                                                className="text-xl font-bold border-transparent hover:border-slate-200 focus:border-indigo-500 px-0 h-auto"
                                                placeholder="Section Title"
                                            />
                                            <Input
                                                value={item.sectionDescription || ''}
                                                onChange={(e) => updateItem(item.id, 'sectionDescription', e.target.value)}
                                                className="text-sm text-slate-500 border-transparent hover:border-slate-200 focus:border-indigo-500 px-0 h-auto"
                                                placeholder="Description (optional)"
                                            />

                                            {isActive && (
                                                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                                                    <Button variant="ghost" size="sm" onClick={() => duplicateItem(item.id)} className="text-slate-500">
                                                        <Copy className="w-4 h-4 mr-1" /> Duplicate
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-600">
                                                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }

                    // QUESTION CARD
                    const FieldIcon = getFieldIcon(item.type || 'text');
                    return (
                        <Card
                            key={item.id}
                            className={`${isActive ? 'ring-2 ring-indigo-500 border-indigo-200' : 'border-slate-200'} shadow-sm cursor-pointer transition-all hover:border-slate-300`}
                            onClick={() => setActiveItem(item.id)}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <div className="mt-2 text-slate-400 cursor-move hover:text-slate-600">
                                        <GripVertical className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        {/* Question Label & Type */}
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <Input
                                                    value={item.label}
                                                    onChange={(e) => updateItem(item.id, 'label', e.target.value)}
                                                    className="font-medium text-lg border-transparent hover:border-slate-200 focus:border-indigo-500 px-0 h-auto py-1"
                                                    placeholder="Question"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <FieldIcon className="w-4 h-4 text-slate-400" />
                                                <select
                                                    value={item.type}
                                                    onChange={(e) => {
                                                        const newType = e.target.value;
                                                        const updates: Partial<FormItem> = { type: newType };
                                                        if (['radio', 'checkbox', 'select'].includes(newType) && !item.options?.length) {
                                                            updates.options = ['Option 1'];
                                                        }
                                                        onChange(questions.map(q => q.id === item.id ? { ...q, ...updates } : q));
                                                    }}
                                                    className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    {FIELD_TYPES.map(ft => (
                                                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Description (optional) */}
                                        {isActive && (
                                            <Input
                                                value={item.description || ''}
                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                className="text-sm text-slate-500 border-transparent hover:border-slate-200 focus:border-indigo-500 px-0 h-auto"
                                                placeholder="Description (optional)"
                                            />
                                        )}

                                        {/* Placeholder for text-based fields */}
                                        {isActive && ['text', 'textarea', 'email', 'tel', 'number', 'url'].includes(item.type || '') && (
                                            <div className="bg-slate-50 rounded-lg p-3">
                                                <Input
                                                    value={item.placeholder || ''}
                                                    onChange={(e) => updateItem(item.id, 'placeholder', e.target.value)}
                                                    className="text-sm bg-white"
                                                    placeholder="Placeholder text (shown to respondents)"
                                                />
                                            </div>
                                        )}

                                        {/* Preview for non-active text fields */}
                                        {!isActive && ['text', 'email', 'tel', 'number', 'url', 'date', 'time'].includes(item.type || '') && (
                                            <div className="h-10 border-b border-dashed border-slate-300 flex items-end pb-1 text-sm text-slate-400">
                                                {item.placeholder || 'Short answer text'}
                                            </div>
                                        )}

                                        {/* Preview for textarea */}
                                        {!isActive && item.type === 'textarea' && (
                                            <div className="h-16 border-b border-dashed border-slate-300 flex items-end pb-1 text-sm text-slate-400">
                                                {item.placeholder || 'Long answer text'}
                                            </div>
                                        )}

                                        {/* Options for Radio/Checkbox/Select */}
                                        {['radio', 'checkbox', 'select'].includes(item.type || '') && (
                                            <div className="space-y-2">
                                                {item.options?.map((opt, idx) => (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        {item.type === 'checkbox' ? (
                                                            <div className="w-4 h-4 border-2 border-slate-300 rounded" />
                                                        ) : item.type === 'radio' ? (
                                                            <div className="w-4 h-4 border-2 border-slate-300 rounded-full" />
                                                        ) : (
                                                            <span className="text-sm text-slate-400 w-4">{idx + 1}.</span>
                                                        )}
                                                        <Input
                                                            value={opt}
                                                            onChange={(e) => updateOption(item.id, idx, e.target.value)}
                                                            className="flex-1 h-8 text-sm border-transparent hover:border-slate-200 focus:border-indigo-500 px-1"
                                                        />
                                                        {isActive && item.options && item.options.length > 1 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => { e.stopPropagation(); removeOption(item.id, idx); }}
                                                                className="text-slate-400 hover:text-red-500 h-8 w-8 p-0"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                                {isActive && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); addOption(item.id); }}
                                                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-600 pl-7"
                                                    >
                                                        {item.type === 'checkbox' ? (
                                                            <div className="w-4 h-4 border-2 border-dashed border-slate-300 rounded" />
                                                        ) : item.type === 'radio' ? (
                                                            <div className="w-4 h-4 border-2 border-dashed border-slate-300 rounded-full" />
                                                        ) : null}
                                                        Add option
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Footer Actions */}
                                        {isActive && (
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); duplicateItem(item.id); }} className="text-slate-500 h-8">
                                                        <Copy className="w-4 h-4 mr-1" /> Duplicate
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="text-red-500 hover:text-red-600 h-8">
                                                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-slate-500">Required</span>
                                                        <Switch
                                                            checked={item.required || false}
                                                            onCheckedChange={(checked) => updateItem(item.id, 'required', checked)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Required indicator for non-active */}
                                        {!isActive && item.required && (
                                            <div className="text-xs text-red-500 font-medium">* Required</div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Add Buttons */}
            <div className="flex gap-3 pt-2">
                <Button
                    variant="outline"
                    onClick={() => addQuestion('text')}
                    className="flex-1 h-12 border-dashed border-2 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Question
                </Button>
                <Button
                    variant="outline"
                    onClick={() => addSection()}
                    className="h-12 border-dashed border-2 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"
                >
                    <SeparatorHorizontal className="w-5 h-5 mr-2" />
                    Add Section
                </Button>
            </div>

            {/* Empty State */}
            {questions.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <Type className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No questions yet</p>
                    <p className="text-sm">Add questions and sections to build your form</p>
                </div>
            )}
        </div>
    );
}
