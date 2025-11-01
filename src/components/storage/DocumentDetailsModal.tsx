import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DocumentStorage, useDocumentComments, useAddDocumentComment, useUploadReplacement } from '@/hooks/useStorageCentre';
import { format } from 'date-fns';
import { useState, useRef } from 'react';
import { Loader2, Send, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DocumentDetailsModalProps {
  document: DocumentStorage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentDetailsModal({ document, open, onOpenChange }: DocumentDetailsModalProps) {
  const [comment, setComment] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userRole } = useAuth();
  const { data: comments, isLoading: commentsLoading } = useDocumentComments(document?.id || '');
  const addCommentMutation = useAddDocumentComment();
  const uploadReplacementMutation = useUploadReplacement();

  const isAdmin = userRole === 'administrator' || userRole === 'hr_admin';

  const handleAddComment = () => {
    if (!document || !comment.trim()) return;

    const commentType = isAdmin ? 'admin_note' : 'employee_reply';
    
    addCommentMutation.mutate(
      { 
        docId: document.id, 
        comment: comment.trim(), 
        type: commentType 
      },
      {
        onSuccess: () => {
          setComment('');
        }
      }
    );
  };

  const handleUploadReplacement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !document) return;

    uploadReplacementMutation.mutate({
      file,
      documentType: document.document_type,
      replacesDocumentId: document.id,
      replacementReason: 'Uploaded from discussion'
    }, {
      onSuccess: () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Document Discussion</DialogTitle>
          <DialogDescription>
            {document.document_name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[400px] pr-4">
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((commentItem: any) => {
                  const isAdminComment = commentItem.comment_type === 'admin_note' || commentItem.comment_type === 'system';
                  const userName = commentItem.user 
                    ? `${commentItem.user.first_name || ''} ${commentItem.user.last_name || ''}`.trim()
                    : (isAdminComment ? 'Admin' : 'Employee');
                  const initials = userName.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase() || '?';

                  return (
                    <div 
                      key={commentItem.id} 
                      className={`flex gap-3 ${isAdminComment ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className={isAdminComment ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${isAdminComment ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${isAdminComment ? 'order-2' : ''}`}>
                            {userName}
                            {isAdminComment && (
                              <span className="ml-1 text-xs text-primary">(Admin)</span>
                            )}
                          </span>
                          <span className={`text-xs text-muted-foreground ${isAdminComment ? 'order-1' : ''}`}>
                            {format(new Date(commentItem.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <div 
                          className={`p-3 rounded-lg text-sm ${
                            isAdminComment 
                              ? 'bg-primary/10 border border-primary/20' 
                              : 'bg-muted'
                          }`}
                        >
                          {commentItem.comment}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No comments yet</p>
                <p className="text-sm mt-1">Start a discussion about this document</p>
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="new-comment">
            {isAdmin ? 'Add Admin Note' : 'Add Reply'}
          </Label>
          <Textarea
            id="new-comment"
            placeholder={isAdmin ? "Add a note or request changes..." : "Reply to the admin..."}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1 flex gap-2">
            {!isAdmin && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleUploadReplacement}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadReplacementMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  {uploadReplacementMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Replacement
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              Close
            </Button>
            <Button 
              onClick={handleAddComment}
              disabled={!comment.trim() || addCommentMutation.isPending}
              className="flex-1 sm:flex-none"
            >
              {addCommentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
