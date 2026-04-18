import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { format, addDays, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { getEvents, getMembers, createEvent, updateEvent, deleteEvent } from '@/lib/supabase';

// Tool definitions
const TOOLS = [
  {
    name: 'list_events',
    description: 'Get events for a specific date range',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'create_event',
    description: 'Create a new calendar event',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Event title',
        },
        description: {
          type: 'string',
          description: 'Event description (optional)',
        },
        startDate: {
          type: 'string',
          description: 'Event date in YYYY-MM-DD format',
        },
        memberId: {
          type: 'string',
          description: 'ID of the household member',
        },
        isAllDay: {
          type: 'boolean',
          description: 'Whether this is an all-day event (default: true)',
        },
      },
      required: ['title', 'startDate', 'memberId'],
    },
  },
  {
    name: 'update_event',
    description: 'Update an existing event',
    inputSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of the event to update',
        },
        title: {
          type: 'string',
          description: 'New title (optional)',
        },
        description: {
          type: 'string',
          description: 'New description (optional)',
        },
        startDate: {
          type: 'string',
          description: 'New date in YYYY-MM-DD format (optional)',
        },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'delete_event',
    description: 'Delete a calendar event',
    inputSchema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of the event to delete',
        },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'get_members',
    description: 'Get all household members',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_member_schedule',
    description: 'Get events for a specific member',
    inputSchema: {
      type: 'object',
      properties: {
        memberId: {
          type: 'string',
          description: 'ID of the household member',
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
      },
      required: ['memberId', 'startDate', 'endDate'],
    },
  },
  {
    name: 'find_free_slots',
    description: 'Find dates when all members have no events',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
      },
      required: ['startDate', 'endDate'],
    },
  },
];

// Resource definitions
const RESOURCES = [
  {
    uri: 'calendar://today',
    name: 'Today\'s Events',
    description: 'Events scheduled for today',
    mimeType: 'application/json',
  },
  {
    uri: 'calendar://week',
    name: 'This Week',
    description: 'Events for the current week',
    mimeType: 'application/json',
  },
  {
    uri: 'calendar://members',
    name: 'Household Members',
    description: 'List of all household members',
    mimeType: 'application/json',
  },
];

export function createMCPServer() {
  const server = new Server(
    {
      name: 'household-calendar',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // List tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Call tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'list_events': {
          const { startDate, endDate } = args as { startDate: string; endDate: string };
          const events = await getEvents(startDate, endDate);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(events, null, 2),
              },
            ],
          };
        }

        case 'create_event': {
          const { title, description, startDate, memberId, isAllDay = true } = args as {
            title: string;
            description?: string;
            startDate: string;
            memberId: string;
            isAllDay?: boolean;
          };
          const event = await createEvent({
            title,
            description,
            start_date: startDate,
            is_all_day: isAllDay,
            member_id: memberId,
          });
          return {
            content: [
              {
                type: 'text',
                text: `Created event: ${event.title} on ${event.start_date}`,
              },
            ],
          };
        }

        case 'update_event': {
          const { eventId, title, description, startDate } = args as {
            eventId: string;
            title?: string;
            description?: string;
            startDate?: string;
          };
          const updateData: Record<string, unknown> = {};
          if (title) updateData.title = title;
          if (description) updateData.description = description;
          if (startDate) updateData.start_date = startDate;
          const event = await updateEvent(eventId, updateData);
          return {
            content: [
              {
                type: 'text',
                text: `Updated event: ${event.title}`,
              },
            ],
          };
        }

        case 'delete_event': {
          const { eventId } = args as { eventId: string };
          await deleteEvent(eventId);
          return {
            content: [
              {
                type: 'text',
                text: 'Event deleted successfully',
              },
            ],
          };
        }

        case 'get_members': {
          const members = await getMembers();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(members, null, 2),
              },
            ],
          };
        }

        case 'get_member_schedule': {
          const { memberId, startDate, endDate } = args as {
            memberId: string;
            startDate: string;
            endDate: string;
          };
          const allEvents = await getEvents(startDate, endDate);
          const memberEvents = allEvents.filter((e) => e.member_id === memberId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(memberEvents, null, 2),
              },
            ],
          };
        }

        case 'find_free_slots': {
          const { startDate, endDate } = args as { startDate: string; endDate: string };
          const events = await getEvents(startDate, endDate);
          const members = await getMembers();

          // Find dates with no events
          const start = parseISO(startDate);
          const end = parseISO(endDate);
          const dates: string[] = [];

          for (let d = start; d <= end; d = addDays(d, 1)) {
            const dateStr = format(d, 'yyyy-MM-dd');
            const dayEvents = events.filter((e) => e.start_date === dateStr);
            if (dayEvents.length === 0) {
              dates.push(dateStr);
            }
          }

          return {
            content: [
              {
                type: 'text',
                text: `Free dates between ${startDate} and ${endDate}:\n${dates.join('\n')}`,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  });

  // List resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: RESOURCES };
  });

  // Read resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    try {
      switch (uri) {
        case 'calendar://today': {
          const today = format(new Date(), 'yyyy-MM-dd');
          const events = await getEvents(today, today);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(events, null, 2),
              },
            ],
          };
        }

        case 'calendar://week': {
          const start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
          const end = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
          const events = await getEvents(start, end);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(events, null, 2),
              },
            ],
          };
        }

        case 'calendar://members': {
          const members = await getMembers();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(members, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    } catch (error) {
      throw new Error(`Failed to read resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  return server;
}

// Run server if called directly
if (require.main === module) {
  const server = createMCPServer();
  const transport = new StdioServerTransport();
  server.connect(transport).catch(console.error);
}
