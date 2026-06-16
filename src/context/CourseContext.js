import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { api } from '../config/api';

const CourseContext = createContext({});

export const useCourses = () => useContext(CourseContext);

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all courses from backend
  const fetchCourses = useCallback(async () => {
    try {
      const data = await api.get('/courses');
      if (data.success) {
        setCourses(data.courses);
        // Extract unique categories
        const uniqueCategories = [...new Set(data.courses.map((c) => c.category).filter(Boolean))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.log('Error fetching courses:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const addCourse = async (courseData) => {
    try {
      const data = await api.post('/courses', courseData);
      if (data.success) {
        // Refresh courses list
        await fetchCourses();
        return { success: true, id: data.id || data.course?.id };
      }
      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateCourse = async (courseId, courseData) => {
    try {
      const data = await api.put(`/courses/${courseId}`, courseData);
      if (data.success) {
        await fetchCourses();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteCourse = async (courseId) => {
    try {
      const data = await api.delete(`/courses/${courseId}`);
      if (data.success) {
        setCourses((prev) => prev.filter((c) => c.id !== courseId && c._id !== courseId));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getCourseById = (courseId) => {
    return courses.find((c) => c.id === courseId || c._id === courseId);
  };

  const getCoursesByCategory = (category) => {
    if (!category || category === 'All') return courses;
    return courses.filter((c) => c.category === category);
  };

  const searchCourses = (searchQuery) => {
    const q = searchQuery.toLowerCase();
    return courses.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.instructor?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
    );
  };

  return (
    <CourseContext.Provider
      value={{
        courses,
        categories,
        loading,
        addCourse,
        updateCourse,
        deleteCourse,
        getCourseById,
        getCoursesByCategory,
        searchCourses,
        refreshCourses: fetchCourses,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};
