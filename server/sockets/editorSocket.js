module.exports = (io) => {
  // Use a namespace for the editor to keep it separate from chat
  const editorNamespace = io.of('/editor');

  editorNamespace.on('connection', (socket) => {
    console.log(`User connected to editor: ${socket.id}`);

    // Join a project editor room
    socket.on('join_editor', (projectId) => {
      socket.join(projectId);
      console.log(`Socket ${socket.id} joined editor room: ${projectId}`);
    });

    // Handle code changes (Broadcasting to others in the same project)
    socket.on('code_change', ({ projectId, path, content }) => {
      socket.to(projectId).emit('code_update', { path, content });
    });

    // Handle cursor movements (Optional but good for UX)
    socket.on('cursor_move', ({ projectId, userId, name, cursor }) => {
      socket.to(projectId).emit('cursor_update', { userId, name, cursor });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected from editor: ${socket.id}`);
    });
  });
};
