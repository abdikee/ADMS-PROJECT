import { useNavigate } from 'react-router';
import { Users, School } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.jsx';
import { Badge } from '../../../components/ui/badge.jsx';
import { Button } from '../../../components/ui/button.jsx';

export function MyClassesTab({ assignedClasses = [], students = [], homeroomClassId }) {
  const navigate = useNavigate();

  if (assignedClasses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <School className="h-10 w-10 opacity-40" />
        <p className="text-sm">No classes assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {assignedClasses.map((classItem) => {
        const studentCount = students.filter(
          (s) => String(s.classId) === String(classItem.id)
        ).length;
        const isHomeroom = String(classItem.id) === String(homeroomClassId);
        const gradeSection = classItem.section
          ? `Grade ${classItem.grade} (${classItem.section})`
          : `Grade ${classItem.grade}`;

        return (
          <Card key={classItem.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{classItem.name}</CardTitle>
                {isHomeroom && (
                  <Badge className="bg-green-500 text-white border-transparent hover:bg-green-600 shrink-0">
                    Homeroom
                  </Badge>
                )}
              </div>
              {classItem.grade != null && (
                <p className="text-sm text-muted-foreground">{gradeSection}</p>
              )}
              {classItem.academicYear && (
                <p className="text-xs text-muted-foreground">{classItem.academicYear}</p>
              )}
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{studentCount} student{studentCount !== 1 ? 's' : ''}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/students')}>
                View Students
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
