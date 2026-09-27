import 'package:flutter/material.dart';

class ViewEditSheet extends StatefulWidget {
  final String title;
  final Widget viewContent;
  final Widget editContent;
  final VoidCallback? onEditPressed;
  final Future<bool> Function()? onSavePressed;
  final bool initialEditMode;

  const ViewEditSheet({
    super.key,
    required this.title,
    required this.viewContent,
    required this.editContent,
    this.onEditPressed,
    this.onSavePressed,
    this.initialEditMode = false,
  });

  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    required Widget viewContent,
    required Widget editContent,
    VoidCallback? onEditPressed,
    Future<bool> Function()? onSavePressed,
    bool initialEditMode = false,
    bool isScrollControlled = true,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: isScrollControlled,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: ViewEditSheet(
            title: title,
            viewContent: viewContent,
            editContent: editContent,
            onEditPressed: onEditPressed,
            onSavePressed: onSavePressed,
            initialEditMode: initialEditMode,
          ),
        );
      },
    );
  }

  @override
  State<ViewEditSheet> createState() => _ViewEditSheetState();
}

class _ViewEditSheetState extends State<ViewEditSheet> {
  late bool _isEditing;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _isEditing = widget.initialEditMode;
  }

  void _toggleEdit() {
    setState(() {
      _isEditing = !_isEditing;
    });
    if (_isEditing && widget.onEditPressed != null) {
      widget.onEditPressed!();
    }
  }

  Future<void> _save() async {
    if (widget.onSavePressed != null) {
      setState(() {
        _isSaving = true;
      });
      try {
        final success = await widget.onSavePressed!();
        if (success && mounted) {
          Navigator.of(context).pop();
        }
      } finally {
        if (mounted) {
          setState(() {
            _isSaving = false;
          });
        }
      }
    } else {
      setState(() {
        _isEditing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildHeader(),
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: _isEditing ? widget.editContent : widget.viewContent,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Theme.of(context).dividerColor),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              widget.title,
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_isEditing)
                TextButton(
                  onPressed: _isSaving
                      ? null
                      : () {
                          setState(() {
                            _isEditing = false;
                          });
                        },
                  child: const Text('Cancel'),
                ),
              if (!_isEditing)
                IconButton(
                  icon: const Icon(Icons.edit),
                  onPressed: _toggleEdit,
                  tooltip: 'Edit',
                )
              else
                ElevatedButton(
                  onPressed: _isSaving ? null : _save,
                  style: ElevatedButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          height: 16,
                          width: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Save'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
